<?php

declare(strict_types=1);

namespace Hsd\Api\Tests;

use Hsd\Api\FormValidator;
use Hsd\Api\MailAdapterFactory;
use Hsd\Api\NoSendMailAdapter;
use Hsd\Api\ProjectReviewHandler;
use Hsd\Api\SmtpMailAdapter;
use Hsd\Api\TurnstileValidator;
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
    public function testSuccessfulNoSendFlow(): void
    {
        $handler = new ProjectReviewHandler(
            new FormValidator(),
            new TurnstileValidator('secret', new FakeHttpClient('{"success":true}')),
            new NoSendMailAdapter(),
            requireTurnstile: false,
        );

        $result = $handler->handle([
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
            'turnstile_token' => 'test-token',
        ], '127.0.0.1');

        self::assertTrue($result['ok']);
        self::assertSame('received', $result['code']);
    }

    public function testHoneypotIsRejected(): void
    {
        $handler = new ProjectReviewHandler(
            new FormValidator(),
            new TurnstileValidator('secret', new FakeHttpClient('{"success":true}')),
            new NoSendMailAdapter(),
            requireTurnstile: false,
        );

        $result = $handler->handle([
            'website' => 'filled',
        ], '127.0.0.1');

        self::assertFalse($result['ok']);
        self::assertSame('spam', $result['code']);
    }

    public function testTurnstileFailureReturnsVerificationCode(): void
    {
        $handler = new ProjectReviewHandler(
            new FormValidator(),
            new TurnstileValidator('secret', new FakeHttpClient('{"success":false}')),
            new NoSendMailAdapter(),
            requireTurnstile: true,
        );

        $result = $handler->handle([
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
            'turnstile_token' => 'bad-token',
        ], '127.0.0.1');

        self::assertFalse($result['ok']);
        self::assertSame('verification', $result['code']);
    }
}
