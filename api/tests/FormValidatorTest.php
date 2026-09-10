<?php

declare(strict_types=1);

namespace Hsd\Api\Tests;

use Hsd\Api\FormValidator;
use PHPUnit\Framework\TestCase;

final class FormValidatorTest extends TestCase
{
    private FormValidator $validator;

    protected function setUp(): void
    {
        $this->validator = new FormValidator();
    }

    public function testValidSubmissionPasses(): void
    {
        $result = $this->validator->validate($this->validPayload());

        self::assertTrue($result['ok']);
        self::assertSame('Ada Lovelace', $result['data']['name']);
    }

    public function testHoneypotRejectsSubmission(): void
    {
        $payload = $this->validPayload();
        $payload['website'] = 'https://spam.example';

        $result = $this->validator->validate($payload);

        self::assertFalse($result['ok']);
        self::assertSame('spam', $result['code']);
    }

    public function testMissingRequiredFieldFails(): void
    {
        $payload = $this->validPayload();
        unset($payload['email']);

        $result = $this->validator->validate($payload);

        self::assertFalse($result['ok']);
        self::assertSame('validation', $result['code']);
    }

    public function testLengthLimitFails(): void
    {
        $payload = $this->validPayload();
        $payload['name'] = str_repeat('a', 121);

        $result = $this->validator->validate($payload);

        self::assertFalse($result['ok']);
        self::assertSame('validation', $result['code']);
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
