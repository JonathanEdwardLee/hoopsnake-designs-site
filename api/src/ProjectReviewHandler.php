<?php

declare(strict_types=1);

namespace Hsd\Api;

final class ProjectReviewHandler
{
    public function __construct(
        private readonly FormValidator $validator,
        private readonly MailAdapterInterface $mail,
        private readonly ?GlobalSubmissionThrottle $throttle = null,
    ) {
    }

    /** @param array<string, mixed> $input */
    public function handle(array $input): array
    {
        $validated = $this->validator->validate($input);
        if ($validated['ok'] === false) {
            return ['ok' => false, 'code' => $validated['code']];
        }

        if ($this->throttle !== null) {
            $throttleResult = $this->throttle->checkAndRecord();
            if (!$throttleResult['allowed'] && !$throttleResult['failOpen']) {
                return ['ok' => false, 'code' => 'rate_limited'];
            }
        }

        if (!$this->mail->send($validated['data'])) {
            return ['ok' => false, 'code' => 'delivery_failed'];
        }

        return ['ok' => true, 'code' => 'received'];
    }
}
