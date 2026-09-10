<?php

declare(strict_types=1);

namespace Hsd\Api;

interface HttpClientInterface
{
    /** @param array<string, string> $payload */
    public function post(string $url, array $payload): ?string;
}
