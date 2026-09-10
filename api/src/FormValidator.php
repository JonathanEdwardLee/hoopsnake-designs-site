<?php

declare(strict_types=1);

namespace Hsd\Api;

final class FormValidator
{
    /** @var array<string, int> */
    public const LIMITS = [
        'name' => 120,
        'business_name' => 160,
        'email' => 254,
        'project_type' => 80,
        'current_url' => 500,
        'problem' => 4000,
        'budget_band' => 40,
        'timing' => 40,
        'must_have' => 2000,
        'decision_path' => 1200,
        'ongoing_support' => 80,
        'notes' => 2000,
        'website' => 0,
    ];

    /**
     * @param array<string, mixed> $input
     * @return array{ok: true, data: array<string, string|null>}|array{ok: false, code: string}
     */
    public function validate(array $input): array
    {
        if ($this->honeypotTriggered($input)) {
            return ['ok' => false, 'code' => 'spam'];
        }

        $required = [
            'name',
            'business_name',
            'email',
            'project_type',
            'problem',
            'budget_band',
            'timing',
            'must_have',
            'decision_path',
            'ongoing_support',
        ];

        foreach ($required as $field) {
            if (!isset($input[$field]) || !is_string($input[$field]) || trim($input[$field]) === '') {
                return ['ok' => false, 'code' => 'validation'];
            }
        }

        $email = trim((string) $input['email']);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > self::LIMITS['email']) {
            return ['ok' => false, 'code' => 'validation'];
        }

        $data = [
            'name' => $this->sanitizeField($input, 'name'),
            'business_name' => $this->sanitizeField($input, 'business_name'),
            'email' => $email,
            'project_type' => $this->sanitizeField($input, 'project_type'),
            'current_url' => $this->optionalField($input, 'current_url'),
            'problem' => $this->sanitizeField($input, 'problem'),
            'budget_band' => $this->sanitizeField($input, 'budget_band'),
            'timing' => $this->sanitizeField($input, 'timing'),
            'must_have' => $this->sanitizeField($input, 'must_have'),
            'decision_path' => $this->sanitizeField($input, 'decision_path'),
            'ongoing_support' => $this->sanitizeField($input, 'ongoing_support'),
            'notes' => $this->optionalField($input, 'notes'),
        ];

        foreach ($data as $field => $value) {
            if ($value === null) {
                continue;
            }

            $limit = self::LIMITS[$field] ?? null;
            if ($limit !== null && mb_strlen($value) > $limit) {
                return ['ok' => false, 'code' => 'validation'];
            }
        }

        if ($data['current_url'] !== null && !filter_var($data['current_url'], FILTER_VALIDATE_URL)) {
            return ['ok' => false, 'code' => 'validation'];
        }

        return ['ok' => true, 'data' => $data];
    }

    /** @param array<string, mixed> $input */
    public function honeypotTriggered(array $input): bool
    {
        return isset($input['website']) && is_string($input['website']) && trim($input['website']) !== '';
    }

    /** @param array<string, mixed> $input */
    private function sanitizeField(array $input, string $field): string
    {
        $value = trim((string) ($input[$field] ?? ''));
        $value = str_replace(["\0", "\r"], '', $value);

        return $value;
    }

    /** @param array<string, mixed> $input */
    private function optionalField(array $input, string $field): ?string
    {
        if (!isset($input[$field]) || !is_string($input[$field])) {
            return null;
        }

        $value = trim($input[$field]);
        return $value === '' ? null : $this->sanitizeField($input, $field);
    }
}
