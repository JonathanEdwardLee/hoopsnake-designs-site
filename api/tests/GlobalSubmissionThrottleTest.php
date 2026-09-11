<?php

declare(strict_types=1);

namespace Hsd\Api\Tests;

use Hsd\Api\GlobalSubmissionThrottle;
use PHPUnit\Framework\TestCase;

final class GlobalSubmissionThrottleTest extends TestCase
{
    private string $storageDir;
    private string $storagePath;

    protected function setUp(): void
    {
        $this->storageDir = sys_get_temp_dir() . '/hsd-throttle-' . uniqid('', true);
        mkdir($this->storageDir, 0777, true);
        $this->storagePath = $this->storageDir . '/project-review-throttle.json';
    }

    protected function tearDown(): void
    {
        $this->removeDirectory($this->storageDir);
    }

    public function testAllowsRequestsBelowCap(): void
    {
        $now = 1_700_000_000;
        $throttle = new GlobalSubmissionThrottle($this->storagePath, $now);

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $result = $throttle->checkAndRecord();
            self::assertTrue($result['allowed']);
            self::assertFalse($result['failOpen']);
        }

        $contents = file_get_contents($this->storagePath);
        self::assertIsString($contents);
        $decoded = json_decode($contents, true);
        self::assertIsArray($decoded);
        self::assertCount(5, $decoded['timestamps']);
        self::assertSame([$now, $now, $now, $now, $now], $decoded['timestamps']);
    }

    public function testReturnsRateLimitedAtOrAboveCap(): void
    {
        $now = 1_700_000_000;
        $timestamps = array_fill(0, GlobalSubmissionThrottle::MAX_ATTEMPTS, $now - 60);
        file_put_contents(
            $this->storagePath,
            json_encode(['timestamps' => $timestamps], JSON_THROW_ON_ERROR),
        );
        file_put_contents($this->storagePath . '.lock', '');

        $throttle = new GlobalSubmissionThrottle($this->storagePath, $now);
        $result = $throttle->checkAndRecord();

        self::assertFalse($result['allowed']);
        self::assertFalse($result['failOpen']);
    }

    public function testPrunesTimestampsOutsideRollingWindow(): void
    {
        $now = 1_700_000_000;
        $timestamps = array_fill(0, GlobalSubmissionThrottle::MAX_ATTEMPTS, $now - GlobalSubmissionThrottle::WINDOW_SECONDS - 1);
        file_put_contents(
            $this->storagePath,
            json_encode(['timestamps' => $timestamps], JSON_THROW_ON_ERROR),
        );

        $throttle = new GlobalSubmissionThrottle($this->storagePath, $now);
        $result = $throttle->checkAndRecord();

        self::assertTrue($result['allowed']);
        self::assertFalse($result['failOpen']);

        $decoded = json_decode((string) file_get_contents($this->storagePath), true);
        self::assertIsArray($decoded);
        self::assertCount(1, $decoded['timestamps']);
        self::assertSame($now, $decoded['timestamps'][0]);
    }

    public function testFailsOpenWhenStorageDirectoryIsUnavailable(): void
    {
        $throttle = new GlobalSubmissionThrottle('/dev/null/impossible/project-review-throttle.json');
        $result = $throttle->checkAndRecord();

        self::assertTrue($result['allowed']);
        self::assertTrue($result['failOpen']);
    }

    public function testStoresTimestampsOnly(): void
    {
        $now = 1_700_000_000;
        $throttle = new GlobalSubmissionThrottle($this->storagePath, $now);
        $throttle->checkAndRecord();

        $decoded = json_decode((string) file_get_contents($this->storagePath), true);
        self::assertIsArray($decoded);
        self::assertArrayHasKey('timestamps', $decoded);
        self::assertSame(['timestamps'], array_keys($decoded));
    }

    public function testFailsOpenWhenPersistingAtCapStateFailsAfterSuccessfulRead(): void
    {
        $now = 1_700_000_000;
        $timestamps = array_fill(0, GlobalSubmissionThrottle::MAX_ATTEMPTS, $now - 60);
        file_put_contents(
            $this->storagePath,
            json_encode(['timestamps' => $timestamps], JSON_THROW_ON_ERROR),
        );
        file_put_contents($this->storagePath . '.lock', '');
        chmod($this->storageDir, 0555);

        $throttle = new GlobalSubmissionThrottle($this->storagePath, $now);
        $result = $throttle->checkAndRecord();

        chmod($this->storageDir, 0755);

        self::assertTrue($result['allowed']);
        self::assertTrue($result['failOpen']);
    }

    private function removeDirectory(string $directory): void
    {
        if (!is_dir($directory)) {
            return;
        }

        $items = scandir($directory);
        if ($items === false) {
            return;
        }

        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }

            $path = $directory . '/' . $item;
            if (is_dir($path)) {
                $this->removeDirectory($path);
            } else {
                @chmod($path, 0666);
                unlink($path);
            }
        }

        @chmod($directory, 0755);
        rmdir($directory);
    }
}
