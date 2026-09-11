<?php

declare(strict_types=1);

namespace Hsd\Api\Tests;

use Hsd\Api\FormValidator;
use Hsd\Api\GlobalSubmissionThrottle;
use Hsd\Api\MailAdapterFactory;
use Hsd\Api\NoSendMailAdapter;
use Hsd\Api\ProjectReviewHandler;
use Hsd\Api\SmtpMailAdapter;
use PHPUnit\Framework\TestCase;

final class MailAdapterTest extends TestCase
{
    public function testNoSendAdapterCapturesSubmission(): void
    {
        $adapter = new NoSendMailAdapter();
        $payload = ['name' => 'Test', 'email' => 'test@example.com'];

        self::assertTrue($adapter->send($payload));
        self::assertSame($payload, $adapter->sent[0]);
    }

    public function testSmtpAdapterFailsClosedWithoutConfig(): void
    {
        $adapter = new SmtpMailAdapter([]);
        self::assertFalse($adapter->send(['name' => 'Test', 'email' => 'test@example.com']));
    }

    public function testFactoryUsesNoSendByDefault(): void
    {
        $adapter = MailAdapterFactory::fromConfig(['mail_mode' => 'nosend']);
        self::assertInstanceOf(NoSendMailAdapter::class, $adapter);
    }
}

final class ProjectReviewHandlerTest extends TestCase
{
    private string $throttlePath;

    protected function setUp(): void
    {
        $this->throttlePath = sys_get_temp_dir() . '/hsd-handler-throttle-' . uniqid('', true) . '.json';
    }

    protected function tearDown(): void
    {
        if (is_file($this->throttlePath)) {
            unlink($this->throttlePath);
        }
    }

    public function testSuccessfulNoSendFlow(): void
    {
        $handler = new ProjectReviewHandler(
            new FormValidator(),
            new NoSendMailAdapter(),
        );

        $result = $handler->handle($this->validPayload());

        self::assertTrue($result['ok']);
        self::assertSame('received', $result['code']);
    }

    public function testHoneypotIsRejected(): void
    {
        $handler = new ProjectReviewHandler(
            new FormValidator(),
            new NoSendMailAdapter(),
        );

        $result = $handler->handle([
            'website' => 'filled',
        ]);

        self::assertFalse($result['ok']);
        self::assertSame('spam', $result['code']);
    }

    public function testRateLimitedWhenGlobalCapExceeded(): void
    {
        $now = 1_700_000_000;
        file_put_contents(
            $this->throttlePath,
            json_encode([
                'timestamps' => array_fill(0, GlobalSubmissionThrottle::MAX_ATTEMPTS, $now - 30),
            ], JSON_THROW_ON_ERROR),
        );

        $handler = new ProjectReviewHandler(
            new FormValidator(),
            new NoSendMailAdapter(),
            new GlobalSubmissionThrottle($this->throttlePath, $now),
        );

        $result = $handler->handle($this->validPayload());

        self::assertFalse($result['ok']);
        self::assertSame('rate_limited', $result['code']);
    }

    /** @return array<string, string> */
    private function validPayload(): array
    {
        return [
            'name' => 'Ada Lovelace',
            'business_name' => 'Analytical Engines LLC',
            'email' => 'ada@example.com',
            'project_type' => 'Website / small site',
            'problem' => 'Need a qualified lead system with premium presentation.',
            'budget_band' => '$3,500 – $7,500',
            'timing' => '1–2 months',
            'must_have' => 'Project review form and one integration',
            'decision_path' => 'Founder approves scope directly',
            'ongoing_support' => 'One-time launch only',
        ];
    }
}
