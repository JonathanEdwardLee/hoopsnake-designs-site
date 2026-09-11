<?php

declare(strict_types=1);

namespace Hsd\Api;

final class RuntimeConfig
{
    public const SOURCE_PRODUCTION = 'production';
    public const SOURCE_TEST = 'test';

    /**
     * @return array{config: array<string, mixed>, source: string}|null
     */
    public static function load(string $documentRoot): ?array
    {
        $privateConfigPath = dirname(rtrim($documentRoot, '/\\')) . '/hsd-private/project-review-config.php';

        if (is_readable($privateConfigPath)) {
            $config = require $privateConfigPath;
            if (!is_array($config)) {
                return null;
            }

            return [
                'config' => $config,
                'source' => self::SOURCE_PRODUCTION,
            ];
        }

        $testConfigPath = getenv('HSD_TEST_CONFIG_PATH') ?: ($_SERVER['HSD_TEST_CONFIG_PATH'] ?? '');
        if (is_string($testConfigPath) && $testConfigPath !== '' && is_readable($testConfigPath)) {
            $config = require $testConfigPath;
            if (!is_array($config)) {
                return null;
            }

            return [
                'config' => $config,
                'source' => self::SOURCE_TEST,
            ];
        }

        return null;
    }

    /**
     * @param array{config: array<string, mixed>, source: string} $loaded
     */
    public static function isAllowedForSource(array $loaded): bool
    {
        if ($loaded['source'] !== self::SOURCE_PRODUCTION) {
            return true;
        }

        return ($loaded['config']['mail_mode'] ?? '') === 'smtp';
    }
}
