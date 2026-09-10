<?php

declare(strict_types=1);

namespace Hsd\Api\Tests;

use PHPUnit\Framework\TestCase;

final class DeploymentBootTest extends TestCase
{
    public function testPackagedDistApiIsSelfContained(): void
    {
        $distApi = dirname(__DIR__, 2) . '/dist/api';
        $entrypoint = $distApi . '/project-review.php';

        self::assertDirectoryExists($distApi);
        self::assertFileExists($entrypoint);
        self::assertFileExists($distApi . '/config.example.php');
        self::assertDirectoryExists($distApi . '/vendor');
        self::assertFileExists($distApi . '/vendor/autoload.php');

        $source = file_get_contents($entrypoint) ?: '';
        self::assertStringContainsString("__DIR__ . '/vendor/autoload.php'", $source);
        self::assertStringContainsString('$apiRoot = __DIR__;', $source);
        self::assertStringContainsString("'/config.example.php'", $source);
    }

    public function testDefaultPackagedConfigUsesNoSendMode(): void
    {
        $config = require dirname(__DIR__, 2) . '/dist/api/config.example.php';
        self::assertSame('nosend', $config['mail_mode'] ?? null);
    }

    public function testSmtpModeFailsClosedWithoutRuntimeSecrets(): void
    {
        $config = ['mail_mode' => 'smtp'];
        $required = ['to_address', 'from_address', 'smtp_user', 'smtp_pass', 'turnstile_secret'];

        foreach ($required as $key) {
            self::assertEmpty($config[$key] ?? null);
        }
    }
}
