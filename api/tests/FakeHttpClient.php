<?php

declare(strict_types=1);

namespace Hsd\Api\Tests;

use Hsd\Api\HttpClientInterface;

final class FakeHttpClient implements HttpClientInterface
{
    public ?string $lastUrl = null;

    public function __construct(private readonly string $response)
    {
    }

    public function post(string $url, array $payload): ?string
    {
        $this->lastUrl = $url;
        return $this->response;
    }
}
