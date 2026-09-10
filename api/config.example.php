<?php

declare(strict_types=1);

return [
    // mail_mode: nosend | smtp
    'mail_mode' => getenv('HSD_MAIL_MODE') ?: 'nosend',

    // Recommended production inbox (do not create in this mission)
    'to_address' => getenv('HSD_TO_ADDRESS') ?: '',

    // Authenticated From identity for SMTP (not visitor email)
    'from_address' => getenv('HSD_FROM_ADDRESS') ?: '',
    'from_name' => getenv('HSD_FROM_NAME') ?: 'Hoopsnake Designs',

    'smtp_host' => getenv('HSD_SMTP_HOST') ?: 'smtp.hostinger.com',
    'smtp_port' => (int) (getenv('HSD_SMTP_PORT') ?: 587),
    'smtp_secure' => getenv('HSD_SMTP_SECURE') ?: 'tls',
    'smtp_user' => getenv('HSD_SMTP_USER') ?: '',
    'smtp_pass' => getenv('HSD_SMTP_PASS') ?: '',

    // Cloudflare Turnstile secret (runtime only)
    'turnstile_secret' => getenv('HSD_TURNSTILE_SECRET') ?: '',

    // Public widget site key is injected at build/runtime via env for Astro
    'turnstile_site_key' => getenv('HSD_TURNSTILE_SITE_KEY') ?: '',
];
