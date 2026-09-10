<?php

declare(strict_types=1);

namespace Hsd\Api;

use PHPMailer\PHPMailer\Exception as MailerException;
use PHPMailer\PHPMailer\PHPMailer;

interface MailAdapterInterface
{
    /** @param array<string, string|null> $submission */
    public function send(array $submission): bool;
}

final class NoSendMailAdapter implements MailAdapterInterface
{
    /** @var array<int, array<string, string|null>> */
    public array $sent = [];

    /** @param array<string, string|null> $submission */
    public function send(array $submission): bool
    {
        $this->sent[] = $submission;
        return true;
    }
}

final class SmtpMailAdapter implements MailAdapterInterface
{
    public function __construct(private readonly array $config)
    {
    }

    /** @param array<string, string|null> $submission */
    public function send(array $submission): bool
    {
        $required = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'from_address', 'from_name', 'to_address'];
        foreach ($required as $key) {
            if (empty($this->config[$key])) {
                return false;
            }
        }

        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host = (string) $this->config['smtp_host'];
            $mail->Port = (int) $this->config['smtp_port'];
            $mail->SMTPAuth = true;
            $mail->Username = (string) $this->config['smtp_user'];
            $mail->Password = (string) $this->config['smtp_pass'];
            $mail->SMTPSecure = (string) ($this->config['smtp_secure'] ?? PHPMailer::ENCRYPTION_STARTTLS);
            $mail->CharSet = 'UTF-8';

            $mail->setFrom((string) $this->config['from_address'], (string) $this->config['from_name']);
            $mail->addAddress((string) $this->config['to_address']);
            $mail->addReplyTo((string) $submission['email'], (string) $submission['name']);

            $mail->Subject = 'Hoopsnake project review request';
            $mail->Body = $this->buildBody($submission);
            $mail->AltBody = strip_tags(str_replace('<br>', "\n", $mail->Body));

            return $mail->send();
        } catch (MailerException) {
            return false;
        }
    }

    /** @param array<string, string|null> $submission */
    private function buildBody(array $submission): string
    {
        $rows = [
            'Name' => $submission['name'],
            'Business / project' => $submission['business_name'],
            'Email' => $submission['email'],
            'Project type' => $submission['project_type'],
            'Current URL' => $submission['current_url'] ?? 'Not provided',
            'Problem / desired outcome' => $submission['problem'],
            'Budget band' => $submission['budget_band'],
            'Timing' => $submission['timing'],
            'Must-have features / integrations' => $submission['must_have'],
            'Decision-maker / approval path' => $submission['decision_path'],
            'Expected ongoing support' => $submission['ongoing_support'],
            'Notes' => $submission['notes'] ?? 'Not provided',
        ];

        $html = '<p>New Hoopsnake Designs project review request</p><ul>';
        foreach ($rows as $label => $value) {
            $html .= '<li><strong>' . htmlspecialchars((string) $label, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . ':</strong> '
                . nl2br(htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'))
                . '</li>';
        }
        $html .= '</ul>';

        return $html;
    }
}

final class MailAdapterFactory
{
    public static function fromConfig(array $config): MailAdapterInterface
    {
        $mode = $config['mail_mode'] ?? 'nosend';
        if ($mode === 'smtp') {
            return new SmtpMailAdapter($config);
        }

        return new NoSendMailAdapter();
    }
}
