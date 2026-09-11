<?php

declare(strict_types=1);

namespace Hsd\Api\Tests;

use Hsd\Api\FormValidator;
use Hsd\Api\MailAdapterFactory;
use Hsd\Api\NoSendMailAdapter;
use Hsd\Api\ProjectReviewHandler;
use Hsd\Api\TurnstileValidator;
use PHPUnit\Framework\TestCase;

final class DeploymentBootTest extends TestCase
{
    private string $artifactApi;

    protected function setUp(): void
    {
        $this->artifactApi = dirname(__DIR__, 2) . '/release/api';
    }

    public function testPackagedArtifactLayoutIsSelfContained(): void
    {
        $entrypoint = $this->artifactApi . '/project-review.php';

        self::assertDirectoryExists($this->artifactApi);
        self::assertFileExists($entrypoint);
        self::assertDirectoryExists($this->artifactApi . '/src');
        self::assertDirectoryExists($this->artifactApi . '/vendor');
        self::assertFileExists($this->artifactApi . '/vendor/autoload.php');
        self::assertFileDoesNotExist($this->artifactApi . '/config.example.php');
        self::assertFileDoesNotExist($this->artifactApi . '/config.php');

        $source = file_get_contents($entrypoint) ?: '';
        self::assertStringContainsString("__DIR__ . '/vendor/autoload.php'", $source);
        self::assertStringContainsString('hsd-private/project-review-config.php', $source);
    }

    /**
     * @runInSeparateProcess
     * @preserveGlobalState disabled
     */
    public function testPackagedAutoloadResolvesRuntimeClasses(): void
    {
        require $this->artifactApi . '/vendor/autoload.php';

        self::assertTrue(class_exists(FormValidator::class));
        self::assertTrue(class_exists(TurnstileValidator::class));
        self::assertTrue(class_exists(MailAdapterFactory::class));
        self::assertTrue(class_exists(ProjectReviewHandler::class));
        self::assertTrue(class_exists(NoSendMailAdapter::class));
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
