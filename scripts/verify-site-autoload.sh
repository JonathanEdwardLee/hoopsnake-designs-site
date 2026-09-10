#!/usr/bin/env bash
set -euo pipefail

php -r "
require 'site/api/vendor/autoload.php';
\$classes = [
  'Hsd\\\\Api\\\\FormValidator',
  'Hsd\\\\Api\\\\TurnstileValidator',
  'Hsd\\\\Api\\\\MailAdapterFactory',
  'Hsd\\\\Api\\\\ProjectReviewHandler',
  'Hsd\\\\Api\\\\NoSendMailAdapter',
];
foreach (\$classes as \$class) {
  if (!class_exists(\$class)) {
    fwrite(STDERR, \"Missing packaged class: \$class\\n\");
    exit(1);
  }
}
echo \"Packaged autoload resolves all runtime classes.\\n\";
"
