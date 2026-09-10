<?php

declare(strict_types=1);

namespace Hsd\Api;

final class TurnstileValidator
{
    public function __construct(
        private readonly string $secretKey,
        private readonly ?HttpClientInterface $httpClient = null,
    ) {
    }

    public function verify(string $token, ?string $remoteIp = null): bool
    {
        if ($token === '') {
            return false;
        }

        $payload = [
            'secret' => $this->secretKey,
            'response' => $token,
        ];

        if ($remoteIp !== null) {
            $payload['remoteip'] = $remoteIp;
        }

        $client = $this->httpClient ?? new CurlHttpClient();
        $response = $client->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', $payload);

        if ($response === null) {
            return false;
        }

        $decoded = json_decode($response, true);
        return is_array($decoded) && ($decoded['success'] ?? false) === true;
    }
}

final class CurlHttpClient implements HttpClientInterface
{
    /** @param array<string, string> $payload */
    public function post(string $url, array $payload): ?string
    {
        if (!function_exists('curl_init')) {
            return null;
        }

        $handle = curl_init($url);
        if ($handle === false) {
            return null;
        }

        curl_setopt_array($handle, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($payload),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
        ]);

        $response = curl_exec($handle);
        curl_close($handle);

        return is_string($response) ? $response : null;
    }
}
