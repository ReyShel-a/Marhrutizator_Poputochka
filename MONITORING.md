# Руководство по мониторингу и логированию

Это руководство описывает настройку мониторинга и логирования для приложения Rideshare Village.

## Содержание

- [PM2 Monitoring](#pm2-monitoring)
- [Логирование](#логирование)
- [Мониторинг ошибок с Sentry](#мониторинг-ошибок-с-sentry)
- [Мониторинг доступности](#мониторинг-доступности)
- [Мониторинг производительности](#мониторинг-производительности)
- [Алерты и уведомления](#алерты-и-уведомления)

## PM2 Monitoring

### Базовые команды

```bash
# Просмотр статуса всех процессов
pm2 status

# Просмотр логов в реальном времени
pm2 logs rideshare-backend

# Просмотр последних 100 строк логов
pm2 logs rideshare-backend --lines 100

# Мониторинг в реальном времени
pm2 monit

# Информация о процессе
pm2 info rideshare-backend

# Просмотр метрик
pm2 describe rideshare-backend
```

### PM2 Plus (платный сервис)

PM2 Plus предоставляет расширенный мониторинг:

1. Зарегистрируйтесь на [PM2 Plus](https://pm2.io)

2. Подключите сервер:
```bash
pm2 link <secret_key> <public_key>
```

3. Возможности:
   - Мониторинг в реальном времени
   - История метрик
   - Алерты
   - Логи
   - Управление процессами

## Логирование

### Настройка ротации логов

PM2 автоматически ротирует логи с помощью pm2-logrotate:

```bash
# Установка
pm2 install pm2-logrotate

# Настройка максимального размера файла
pm2 set pm2-logrotate:max_size 10M

# Количество файлов для хранения
pm2 set pm2-logrotate:retain 7

# Сжатие старых логов
pm2 set pm2-logrotate:compress true

# Формат даты
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
```

### Просмотр логов

```bash
# Логи приложения
tail -f /var/www/rideshare-backend/logs/out.log
tail -f /var/www/rideshare-backend/logs/error.log

# Логи Nginx
tail -f /var/log/nginx/rideshare-access.log
tail -f /var/log/nginx/rideshare-error.log

# Логи PostgreSQL
tail -f /var/log/postgresql/postgresql-15-main.log
```

### Централизованное логирование

#### Вариант 1: Papertrail

1. Зарегистрируйтесь на [Papertrail](https://papertrailapp.com)

2. Установите remote_syslog2:
```bash
wget https://github.com/papertrail/remote_syslog2/releases/download/v0.20/remote_syslog_linux_amd64.tar.gz
tar xzf remote_syslog_linux_amd64.tar.gz
sudo cp remote_syslog/remote_syslog /usr/local/bin
```

3. Создайте конфигурацию:
```bash
sudo nano /etc/log_files.yml
```

```yaml
files:
  - /var/www/rideshare-backend/logs/*.log
  - /var/log/nginx/*.log
destination:
  host: logs.papertrailapp.com
  port: YOUR_PORT
  protocol: tls
```

4. Запустите как сервис:
```bash
sudo remote_syslog -c /etc/log_files.yml
```

#### Вариант 2: Logtail

1. Зарегистрируйтесь на [Logtail](https://logtail.com)

2. Установите агент:
```bash
curl -s https://logtail.com/install.sh | bash
```

3. Настройте источники логов в веб-интерфейсе

## Мониторинг ошибок с Sentry

### Настройка Backend

1. Создайте проект на [Sentry](https://sentry.io)

2. Установите SDK:
```bash
cd backend
npm install @sentry/node
```

3. Добавьте в `backend/src/index.ts`:
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// После создания Express app
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Перед error handler
app.use(Sentry.Handlers.errorHandler());
```

4. Добавьте SENTRY_DSN в `.env`

### Настройка Frontend

1. Создайте проект на Sentry

2. Установите SDK:
```bash
cd frontend
npm install @sentry/react
```

3. Добавьте в `frontend/src/main.tsx`:
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Использование Sentry

```typescript
// Отправка кастомных ошибок
try {
  // код
} catch (error) {
  Sentry.captureException(error);
}

// Добавление контекста
Sentry.setUser({ id: userId, email: userEmail });
Sentry.setTag('feature', 'booking');
Sentry.setContext('booking', { routeId, passengerId });

// Breadcrumbs
Sentry.addBreadcrumb({
  category: 'booking',
  message: 'User started booking process',
  level: 'info',
});
```

## Мониторинг доступности

### UptimeRobot

1. Зарегистрируйтесь на [UptimeRobot](https://uptimerobot.com)

2. Создайте мониторы:
   - **Frontend**: HTTP(S) monitor для `https://rideshare.example.com`
   - **Backend API**: HTTP(S) monitor для `https://api.rideshare.example.com/health`
   - **Database**: Port monitor для PostgreSQL (если доступен извне)

3. Настройте алерты:
   - Email уведомления
   - SMS (платно)
   - Webhook для Slack/Discord

### Healthchecks.io

Альтернатива UptimeRobot:

1. Зарегистрируйтесь на [Healthchecks.io](https://healthchecks.io)

2. Создайте check

3. Добавьте cron job для пинга:
```bash
# Добавьте в crontab
*/5 * * * * curl -fsS --retry 3 https://hc-ping.com/YOUR-UUID-HERE > /dev/null
```

## Мониторинг производительности

### Backend Performance

#### Node.js встроенные метрики

Добавьте endpoint для метрик:

```typescript
// backend/src/routes/metrics.ts
import { Router } from 'express';

const router = Router();

router.get('/metrics', (req, res) => {
  const usage = process.memoryUsage();
  const uptime = process.uptime();
  
  res.json({
    uptime: uptime,
    memory: {
      rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(usage.external / 1024 / 1024) + ' MB',
    },
    cpu: process.cpuUsage(),
  });
});

export default router;
```

#### Prometheus + Grafana (продвинутый вариант)

1. Установите prom-client:
```bash
npm install prom-client
```

2. Настройте метрики:
```typescript
import promClient from 'prom-client';

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Кастомные метрики
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Endpoint для Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Frontend Performance

#### Web Vitals

Frontend уже настроен для отслеживания Web Vitals. Данные можно отправлять в аналитику:

```typescript
// frontend/src/main.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Отправка в Google Analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
    });
  }
  
  // Или в собственную аналитику
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify(metric),
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Database Performance

#### Мониторинг запросов

```sql
-- Включить логирование медленных запросов
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1 секунда
SELECT pg_reload_conf();

-- Просмотр активных запросов
SELECT pid, age(clock_timestamp(), query_start), usename, query 
FROM pg_stat_activity 
WHERE query != '<IDLE>' AND query NOT ILIKE '%pg_stat_activity%' 
ORDER BY query_start desc;

-- Статистика по таблицам
SELECT schemaname, tablename, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;

-- Размер таблиц
SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### pgAdmin или pgHero

Используйте графические инструменты для мониторинга PostgreSQL:

- [pgAdmin](https://www.pgadmin.org/)
- [pgHero](https://github.com/ankane/pghero)

## Алерты и уведомления

### Настройка алертов в PM2

```bash
# Алерт при высоком использовании памяти
pm2 set pm2:autodump true
pm2 set pm2:max_memory_restart 500M
```

### Slack уведомления

Создайте webhook в Slack и используйте для уведомлений:

```bash
# Скрипт для отправки в Slack
cat > /usr/local/bin/notify-slack.sh << 'EOF'
#!/bin/bash
WEBHOOK_URL="YOUR_SLACK_WEBHOOK_URL"
MESSAGE="$1"

curl -X POST -H 'Content-type: application/json' \
  --data "{\"text\":\"$MESSAGE\"}" \
  $WEBHOOK_URL
EOF

chmod +x /usr/local/bin/notify-slack.sh

# Использование
/usr/local/bin/notify-slack.sh "Backend is down!"
```

### Email алерты

Настройте postfix для отправки email:

```bash
sudo apt install -y postfix mailutils

# Отправка email
echo "Backend is down" | mail -s "Alert: Rideshare Backend" admin@example.com
```

## Дашборды

### Простой дашборд с Netdata

1. Установите Netdata:
```bash
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

2. Доступ к дашборду: `http://your-server-ip:19999`

3. Netdata автоматически мониторит:
   - CPU, RAM, Disk
   - Network
   - Nginx
   - PostgreSQL
   - Node.js процессы

### Grafana + Prometheus (продвинутый)

Для полноценного мониторинга настройте Grafana с Prometheus:

1. Установите Prometheus
2. Установите Grafana
3. Настройте экспортеры для Node.js, PostgreSQL, Nginx
4. Создайте дашборды

## Чек-лист мониторинга

- [ ] PM2 настроен и работает
- [ ] Логи ротируются
- [ ] Sentry настроен для frontend и backend
- [ ] UptimeRobot мониторит доступность
- [ ] Настроены алерты на email/Slack
- [ ] Мониторится использование ресурсов (CPU, RAM, Disk)
- [ ] Мониторится производительность базы данных
- [ ] Настроены бэкапы базы данных
- [ ] Проверяется размер логов
- [ ] Мониторится SSL сертификат (срок действия)

## Полезные команды

```bash
# Проверка использования диска
df -h

# Проверка использования памяти
free -h

# Топ процессов по CPU
top

# Топ процессов по памяти
ps aux --sort=-%mem | head

# Проверка открытых портов
netstat -tulpn

# Проверка соединений к PostgreSQL
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Проверка логов systemd
journalctl -u nginx -f
journalctl -u postgresql -f

# Проверка SSL сертификата
openssl s_client -connect api.rideshare.example.com:443 -servername api.rideshare.example.com | openssl x509 -noout -dates
```

## Troubleshooting

### Высокое использование CPU

1. Проверьте процессы: `top`
2. Проверьте логи на ошибки
3. Проверьте медленные запросы в PostgreSQL
4. Рассмотрите масштабирование

### Высокое использование памяти

1. Проверьте утечки памяти в приложении
2. Настройте `max_memory_restart` в PM2
3. Оптимизируйте запросы к БД
4. Увеличьте RAM сервера

### Медленные запросы

1. Проверьте индексы в БД
2. Оптимизируйте запросы
3. Включите кэширование
4. Рассмотрите connection pooling

### Ошибки 502/504

1. Проверьте, работает ли backend: `pm2 status`
2. Проверьте логи: `pm2 logs`
3. Проверьте Nginx: `nginx -t`
4. Проверьте подключение к БД
