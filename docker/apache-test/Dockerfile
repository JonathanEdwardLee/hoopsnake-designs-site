FROM php:8.3-apache

RUN a2enmod rewrite \
  && sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf \
  && printf '%s\n' \
    'PassEnv HSD_TEST_CONFIG_PATH' \
    'PassEnv HSD_THROTTLE_PATH' \
    > /etc/apache2/conf-available/hsd-test-env.conf \
  && a2enconf hsd-test-env
