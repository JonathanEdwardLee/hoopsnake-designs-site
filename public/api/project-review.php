<?php

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

use Hsd\Api\CurlHttpClient;
use Hsd\Api\FormValidator;
use Hsd\Api\JsonResponse;
use Hsd\Api\MailAdapterFactory;
use Hsd\Api\ProjectReviewHandler;
use Hsd\Api\RuntimeConfig;
use Hsd\Api\TurnstileValidator;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    JsonResponse::send(['ok' => false, 'code' => 'method_not_allowed'], 405);
}

$documentRoot = $_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__);
$loaded = RuntimeConfig::load($documentRoot);
if ($loaded === null) {
    JsonResponse::send([
        'ok' => false,
        'code' => 'unavailable',
        'message' => 'Project review delivery is not configured yet.',
    ], 503);
}

if (!RuntimeConfig::isAllowedForSource($loaded)) {
    JsonResponse::send([
        'ok' => false,
        'code' => 'unavailable',
        'message' => 'Project review delivery is not configured yet.',
    ], 503);
}

$config = $loaded['config'];

$raw = file_get_contents('php://input');
$input = json_decode($raw ?: '[]', true);
if (!is_array($input)) {
    JsonResponse::send(['ok' => false, 'code' => 'validation'], 400);
}

$mailMode = $config['mail_mode'] ?? 'nosend';
if ($mailMode === 'smtp') {
    $required = ['to_address', 'from_address', 'smtp_user', 'smtp_pass', 'turnstile_secret'];
    foreach ($required as $key) {
        if (empty($config[$key])) {
            JsonResponse::send([
                'ok' => false,
                'code' => 'unavailable',
                'message' => 'Project review delivery is not configured yet.',
            ], 503);
        }
    }
}

$turnstileSecret = (string) ($config['turnstile_secret'] ?? '');
if ($mailMode === 'smtp') {
    $turnstile = new TurnstileValidator($turnstileSecret, new CurlHttpClient());
} else {
    $secretForValidator = $turnstileSecret !== ''
        ? $turnstileSecret
        : '1x0000000000000000000000000000000AA';
    $turnstile = new TurnstileValidator($secretForValidator, new CurlHttpClient());
}

$handler = new ProjectReviewHandler(
    new FormValidator(),
    $turnstile,
    MailAdapterFactory::fromConfig($config),
    requireTurnstile: $mailMode === 'smtp',
);

$remoteIp = $_SERVER['REMOTE_ADDR'] ?? null;
$result = $handler->handle($input, is_string($remoteIp) ? $remoteIp : null);

$status = match ($result['code']) {
    'received' => 200,
    'rate_limited' => 429,
    'unavailable', 'delivery_failed' => 503,
    default => 400,
};

JsonResponse::send($result, $status);
