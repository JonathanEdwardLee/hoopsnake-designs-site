<?php

declare(strict_types=1);

/**
 * Production private configuration template.
 *
 * Copy to (outside public_html):
 *   ../hsd-private/project-review-config.php
 * resolved relative to the hosting document root.
 *
 * Example: if DOCUMENT_ROOT is /home/account/public_html then place at:
 *   /home/account/hsd-private/project-review-config.php
 *
 * Do not commit real secrets or mailbox addresses to Git.
 */
return [
    'mail_mode' => 'smtp',
    'to_address' => '',
    'from_address' => '',
    'from_name' => 'Hoopsnake Designs',
    'smtp_host' => 'smtp.hostinger.com',
    'smtp_port' => 587,
    'smtp_secure' => 'tls',
    'smtp_user' => '',
    'smtp_pass' => '',
];
