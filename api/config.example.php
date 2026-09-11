<?php

declare(strict_types=1);

return [
    // mail_mode: nosend | smtp
    'mail_mode' => getenv('HSD_MAIL_MODE') ?: 'nosend',

    'to_address' => getenv('HSD_TO_ADDRESS') ?: '',
    'from_address' => getenv('HSD_FROM_ADDRESS') ?: '',
    'from_name' => getenv('HSD_FROM_NAME') ?: 'Hoopsnake Designs',

    'smtp_host' => getenv('HSD_SMTP_HOST') ?: 'smtp.hostinger.com',
    'smtp_port' => (int) (getenv('HSD_SMTP_PORT') ?: 587),
    'smtp_secure' => getenv('HSD_SMTP_SECURE') ?: 'tls',
    'smtp_user' => getenv('HSD_SMTP_USER') ?: '',
    'smtp_pass' => getenv('HSD_SMTP_PASS') ?: '',
];
