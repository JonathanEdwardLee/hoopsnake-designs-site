<?php

declare(strict_types=1);

namespace Hsd\Api\Tests;

use Hsd\Api\RuntimeConfig;
use PHPUnit\Framework\TestCase;

final class RuntimeConfigTest extends TestCase
{
    private string $fixtureRoot;

    protected function setUp(): void
    {
        $this->fixtureRoot = sys_get_temp_dir() . '/hsd-runtime-config-' . uniqid('', true);
        mkdir($this->fixtureRoot, 0777, true);
        mkdir($this->fixtureRoot . '/public_html', 0777, true);
    }

    protected function tearDown(): void
    {
        $this->removeDirectory($this->fixtureRoot);
    }

    public function testProductionPrivateConfigMustUseSmtpMode(): void
    {
        mkdir($this->fixtureRoot . '/hsd-private', 0777, true);
        file_put_contents(
            $this->fixtureRoot . '/hsd-private/project-review-config.php',
            "<?php\nreturn ['mail_mode' => 'nosend'];\n",
        );

        $loaded = RuntimeConfig::load($this->fixtureRoot . '/public_html');

        self::assertNotNull($loaded);
        self::assertSame(RuntimeConfig::SOURCE_PRODUCTION, $loaded['source']);
        self::assertFalse(RuntimeConfig::isAllowedForSource($loaded));
    }

    public function testProductionPrivateConfigAllowsSmtpMode(): void
    {
        mkdir($this->fixtureRoot . '/hsd-private', 0777, true);
        file_put_contents(
            $this->fixtureRoot . '/hsd-private/project-review-config.php',
            "<?php\nreturn ['mail_mode' => 'smtp'];\n",
        );

        $loaded = RuntimeConfig::load($this->fixtureRoot . '/public_html');

        self::assertNotNull($loaded);
        self::assertTrue(RuntimeConfig::isAllowedForSource($loaded));
    }

    public function testTestConfigSeamAllowsNosendMode(): void
    {
        $testConfig = $this->fixtureRoot . '/test-config.php';
        file_put_contents($testConfig, "<?php\nreturn ['mail_mode' => 'nosend'];\n");
        putenv('HSD_TEST_CONFIG_PATH=' . $testConfig);

        $loaded = RuntimeConfig::load($this->fixtureRoot . '/public_html');

        self::assertNotNull($loaded);
        self::assertSame(RuntimeConfig::SOURCE_TEST, $loaded['source']);
        self::assertTrue(RuntimeConfig::isAllowedForSource($loaded));

        putenv('HSD_TEST_CONFIG_PATH');
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
                unlink($path);
            }
        }

        rmdir($directory);
    }
}
