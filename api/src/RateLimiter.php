<?php

declare(strict_types=1);

namespace Hsd\Api;

final class RateLimiter
{
    /** @var array<string, array<int, int>> */
    private array $events = [];

    public function __construct(private readonly int $maxRequests, private readonly int $windowSeconds)
    {
    }

    public function allow(string $key): bool
    {
        $now = time();
        $windowStart = $now - $this->windowSeconds;
        $existing = $this->events[$key] ?? [];
        $recent = array_values(array_filter($existing, static fn (int $timestamp): bool => $timestamp >= $windowStart));

        if (count($recent) >= $this->maxRequests) {
            $this->events[$key] = $recent;
            return false;
        }

        $recent[] = $now;
        $this->events[$key] = $recent;
        return true;
    }
}
