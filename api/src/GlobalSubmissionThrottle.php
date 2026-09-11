<?php

declare(strict_types=1);

namespace Hsd\Api;

final class GlobalSubmissionThrottle
{
    public const MAX_ATTEMPTS = 20;
    public const WINDOW_SECONDS = 600;

    public function __construct(
        private readonly string $storagePath,
        private readonly ?int $now = null,
    ) {
    }

    public static function storagePathForDocumentRoot(string $documentRoot): string
    {
        $override = getenv('HSD_THROTTLE_PATH') ?: ($_SERVER['HSD_THROTTLE_PATH'] ?? '');
        if (is_string($override) && $override !== '') {
            return $override;
        }

        return dirname(rtrim($documentRoot, '/\\')) . '/hsd-private/project-review-throttle.json';
    }

    /**
     * @return array{allowed: bool, failOpen: bool}
     */
    public function checkAndRecord(): array
    {
        $now = $this->now ?? time();
        $directory = dirname($this->storagePath);
        if (!is_dir($directory) && !@mkdir($directory, 0770, true) && !is_dir($directory)) {
            return ['allowed' => true, 'failOpen' => true];
        }

        $lockHandle = @fopen($this->lockPath(), 'c+');
        if ($lockHandle === false) {
            return ['allowed' => true, 'failOpen' => true];
        }

        try {
            if (!flock($lockHandle, LOCK_EX)) {
                fclose($lockHandle);

                return ['allowed' => true, 'failOpen' => true];
            }

            $timestamps = $this->readTimestamps();
            $cutoff = $now - self::WINDOW_SECONDS;
            $timestamps = array_values(array_filter(
                $timestamps,
                static fn (int $timestamp): bool => $timestamp > $cutoff,
            ));

            if (count($timestamps) >= self::MAX_ATTEMPTS) {
                if (!$this->persistTimestamps($timestamps)) {
                    flock($lockHandle, LOCK_UN);
                    fclose($lockHandle);

                    return ['allowed' => true, 'failOpen' => true];
                }

                flock($lockHandle, LOCK_UN);
                fclose($lockHandle);

                return ['allowed' => false, 'failOpen' => false];
            }

            $timestamps[] = $now;
            if (!$this->persistTimestamps($timestamps)) {
                flock($lockHandle, LOCK_UN);
                fclose($lockHandle);

                return ['allowed' => true, 'failOpen' => true];
            }

            flock($lockHandle, LOCK_UN);
            fclose($lockHandle);

            return ['allowed' => true, 'failOpen' => false];
        } catch (\Throwable) {
            if (is_resource($lockHandle)) {
                flock($lockHandle, LOCK_UN);
                fclose($lockHandle);
            }

            return ['allowed' => true, 'failOpen' => true];
        }
    }

    private function lockPath(): string
    {
        return $this->storagePath . '.lock';
    }

    /** @return list<int> */
    private function readTimestamps(): array
    {
        if (!is_readable($this->storagePath)) {
            return [];
        }

        $contents = file_get_contents($this->storagePath);

        return $this->parseTimestamps(is_string($contents) ? $contents : null);
    }

    /**
     * @param list<int> $timestamps
     */
    private function persistTimestamps(array $timestamps): bool
    {
        $payload = json_encode(['timestamps' => $timestamps], JSON_THROW_ON_ERROR);
        $directory = dirname($this->storagePath);
        $tempPath = $directory . '/.' . basename($this->storagePath) . '.tmp.' . bin2hex(random_bytes(4));

        $handle = @fopen($tempPath, 'cb');
        if ($handle === false) {
            return false;
        }

        if (!flock($handle, LOCK_EX)) {
            fclose($handle);
            @unlink($tempPath);

            return false;
        }

        if (!rewind($handle)) {
            flock($handle, LOCK_UN);
            fclose($handle);
            @unlink($tempPath);

            return false;
        }

        if (!ftruncate($handle, 0)) {
            flock($handle, LOCK_UN);
            fclose($handle);
            @unlink($tempPath);

            return false;
        }

        $written = fwrite($handle, $payload);
        $flushed = fflush($handle);
        flock($handle, LOCK_UN);
        fclose($handle);

        if ($written === false || $written !== strlen($payload) || !$flushed) {
            @unlink($tempPath);

            return false;
        }

        if (!@rename($tempPath, $this->storagePath)) {
            @unlink($tempPath);

            return false;
        }

        return true;
    }

    /** @return list<int> */
    private function parseTimestamps(?string $contents): array
    {
        if ($contents === null || trim($contents) === '') {
            return [];
        }

        $decoded = json_decode($contents, true);
        if (!is_array($decoded) || !isset($decoded['timestamps']) || !is_array($decoded['timestamps'])) {
            return [];
        }

        return array_values(array_filter(
            array_map(static fn ($value): int => (int) $value, $decoded['timestamps']),
            static fn (int $timestamp): bool => $timestamp > 0,
        ));
    }
}
