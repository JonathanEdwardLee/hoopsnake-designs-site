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

        $handle = @fopen($this->storagePath, 'c+');
        if ($handle === false) {
            return ['allowed' => true, 'failOpen' => true];
        }

        try {
            if (!flock($handle, LOCK_EX)) {
                fclose($handle);
                return ['allowed' => true, 'failOpen' => true];
            }

            $contents = stream_get_contents($handle);
            $timestamps = $this->parseTimestamps(is_string($contents) ? $contents : null);
            $cutoff = $now - self::WINDOW_SECONDS;
            $timestamps = array_values(array_filter(
                $timestamps,
                static fn (int $timestamp): bool => $timestamp > $cutoff,
            ));

            if (count($timestamps) >= self::MAX_ATTEMPTS) {
                $this->writeTimestamps($handle, $timestamps);
                flock($handle, LOCK_UN);
                fclose($handle);

                return ['allowed' => false, 'failOpen' => false];
            }

            $timestamps[] = $now;
            if (!$this->writeTimestamps($handle, $timestamps)) {
                flock($handle, LOCK_UN);
                fclose($handle);

                return ['allowed' => true, 'failOpen' => true];
            }

            flock($handle, LOCK_UN);
            fclose($handle);

            return ['allowed' => true, 'failOpen' => false];
        } catch (\Throwable) {
            if (is_resource($handle)) {
                flock($handle, LOCK_UN);
                fclose($handle);
            }

            return ['allowed' => true, 'failOpen' => true];
        }
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

    /**
     * @param resource $handle
     * @param list<int> $timestamps
     */
    private function writeTimestamps($handle, array $timestamps): bool
    {
        $payload = json_encode(['timestamps' => $timestamps], JSON_THROW_ON_ERROR);

        rewind($handle);
        ftruncate($handle, 0);
        $written = fwrite($handle, $payload);
        fflush($handle);

        return $written !== false;
    }
}
