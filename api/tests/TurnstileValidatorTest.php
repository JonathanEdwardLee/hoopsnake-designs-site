<?php

declare(strict_types=1);

namespace Hsd\Api\Tests;

use Hsd\Api\TurnstileValidator;
use PHPUnit\Framework\TestCase;

final class TurnstileValidatorTest extends TestCase
{
    public function testSuccessfulVerification(): void
    {
        $client = new FakeHttpClient('{"success":true}');
        $validator = new TurnstileValidator('secret', $client);

        self::assertTrue($validator->verify('token'));
        self::assertSame('https://challenges.cloudflare.com/turnstile/v0/siteverify', $client->lastUrl);
    }

    public function testFailedVerification(): void
    {
        $client = new FakeHttpClient('{"success":false}');
        $validator = new TurnstileValidator('secret', $client);

        self::assertFalse($validator->verify('token'));
    }

    public function testEmptyTokenFails(): void
    {
        $validator = new TurnstileValidator('secret', new FakeHttpClient('{"success":true}'));

        self::assertFalse($validator->verify(''));
    }
}
