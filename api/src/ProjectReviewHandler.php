<?php

declare(strict_types=1);

namespace Hsd\Api;

final class ProjectReviewHandler
{
    public function __construct(
        private readonly FormValidator $validator,
        private readonly TurnstileValidator $turnstile,
        private readonly MailAdapterInterface $mail,
        private readonly bool $requireTurnstile = true,
    ) {
    }

    /** @param array<string, mixed> $input */
    public function handle(array $input, ?string $remoteIp = null): array
    {
        $validated = $this->validator->validate($input);
        if ($validated['ok'] === false) {
            return ['ok' => false, 'code' => $validated['code']];
        }

        $token = is_string($input['turnstile_token'] ?? null) ? trim((string) $input['turnstile_token']) : '';
        if ($this->requireTurnstile && !$this->turnstile->verify($token, $remoteIp)) {
            return ['ok' => false, 'code' => 'verification'];
        }

        if (!$this->mail->send($validated['data'])) {
            return ['ok' => false, 'code' => 'delivery_failed'];
        }

        return ['ok' => true, 'code' => 'received'];
    }
}
