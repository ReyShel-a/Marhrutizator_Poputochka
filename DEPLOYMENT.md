# Руководство по развертыванию

Это руководство описывает процесс развертывания приложения Rideshare Village в production окружение.

## Содержание

- [CI/CD Pipeline](#cicd-pipeline)
- [Развертывание Frontend](#развертывание-frontend)
- [Развертывание Backend](#развертывание-backend)
- [Настройка базы данных](#настройка-базы-данных)
- [Настройка домена и SSL](#настройка-домена-и-ssl)
- [Мониторинг и логирование](#мониторинг-и-логирование)

## CI/CD Pipeline

Проект использует GitHub Actions для автоматического тестирования и развертывания.

### Настройка GitHub Secrets

Необходимо настроить следующие секреты в настройках репозитория GitHub:

#### Frontend (Vercel)
```
VERCEL_TOKEN - токен доступа к Vercel
VERCEL_ORG_ID - ID организации в Vercel
VERCEL_PROJECT_ID - ID проекта в Vercel
VITE_API_URL - URL backend API (например, https://api.rideshare.example.com)
VITE_GOOGLE_MAPS_API_KEY - API ключ Google Maps
```

#### Backend (VPS)
```
VPS_HOST - IP адрес или домен VPS сервера
VPS_USERNAME - имя пользователя для SSH
VPS_SSH_KEY - приватный SSH ключ для доступа
VPS_PORT - порт SSH (по умолчанию 22)
```

#### Альтернативные платформы

**Netlify:**
```
NETLIFY_AUTH_TOKEN - токен доступа к Netlify
NETLIFY_SITE_ID - ID сайта в Netlify
```

**Railway:**
```
RAILWAY_TOKEN - токен доступа к Railway
```

**Render:**
```
RENDER_DEPLOY_HOOK_URL - URL webhook для деплоя
```

### Workflows

1. **CI Workflow** (`.github/workflows/ci.yml`)
   - Запускается при push и pull request
   - Выполняет линтинг
   - Запускает тесты backend
   - Запускает E2E тесты frontend
   - Проверяет сборку и размер bundle

2. **Deploy Frontend** (`.github/workflows/deploy-frontend.yml`)
   - Запускается при push в main ветку
   - Собирает и деплоит frontend на Vercel/Netlify

3. **Deploy Backend** (`.github/workflows/deploy-backend.yml`)
   - Запускается при push в main ветку
   - Собирает и деплоит backend на VPS/PaaS

## Развертывание Frontend

### Вариант 1: Vercel (Рекомендуется)

1. Создайте аккаунт на [Vercel](https://vercel.com)

2. Установите Vercel CLI:
```bash
npm install -g vercel
```

3. Войдите в аккаунт:
```bash
vercel login
```

4. Разверните проект:
```bash
cd frontend
vercel --prod
```

5. Настройте переменные окружения в Vercel Dashboard:
   - `VITE_API_URL`
   - `VITE_GOOGLE_MAPS_API_KEY`

### Вариант 2: Netlify

1. Создайте аккаунт на [Netlify](https://netlify.com)

2. Установите Netlify CLI:
```bash
npm install -g netlify-cli
```

3. Войдите в аккаунт:
```bash
netlify login
```

4. Инициализируйте проект:
```bash
cd frontend
netlify init
```

5. Разверните:
```bash
netlify deploy --prod
```

6. Настройте переменные окружения в Netlify Dashboard

### Вариант 3: Cloudflare Pages

1. Создайте аккаунт на [Cloudflare Pages](https://pages.cloudflare.com)

2. Подключите GitHub репозиторий

3. Настройте build:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `frontend`

4. Добавьте переменные окружения

## Развертывание Backend

### Вариант 1: VPS (DigitalOcean, Hetzner, Linode)

#### Подготовка сервера

1. Создайте VPS с Ubuntu 22.04 LTS

2. Подключитесь по SSH:
```bash
ssh root@your-server-ip
```

3. Обновите систему:
```bash
apt update && apt upgrade -y
```

4. Установите Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

5. Установите PostgreSQL с PostGIS:
```bash
apt install -y postgresql postgresql-contrib postgis
```

6. Установите PM2:
```bash
npm install -g pm2
```

7. Настройте firewall:
```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

#### Развертывание приложения

1. Создайте пользователя для приложения:
```bash
adduser rideshare
usermod -aG sudo rideshare
su - rideshare
```

2. Клонируйте репозиторий:
```bash
cd /var/www
git clone https://github.com/your-username/rideshare-village.git
cd rideshare-village/backend
```

3. Установите зависимости:
```bash
npm ci --production
```

4. Создайте файл `.env`:
```bash
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://rideshare:password@localhost:5432/rideshare
CORS_ORIGIN=https://your-frontend-domain.com
EOF
```

5. Соберите проект:
```bash
npm run build
```

6. Запустите с PM2:
```bash
pm2 start dist/index.js --name rideshare-backend
pm2 save
pm2 startup
```

#### Настройка Nginx

1. Установите Nginx:
```bash
sudo apt install -y nginx
```

2. Создайте конфигурацию:
```bash
sudo nano /etc/nginx/sites-available/rideshare
```

```nginx
server {
    listen 80;
    server_name api.rideshare.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Активируйте конфигурацию:
```bash
sudo ln -s /etc/nginx/sites-available/rideshare /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Вариант 2: Railway

1. Создайте аккаунт на [Railway](https://railway.app)

2. Установите Railway CLI:
```bash
npm install -g @railway/cli
```

3. Войдите в аккаунт:
```bash
railway login
```

4. Инициализируйте проект:
```bash
cd backend
railway init
```

5. Добавьте PostgreSQL:
```bash
railway add postgresql
```

6. Разверните:
```bash
railway up
```

7. Настройте переменные окружения в Railway Dashboard

### Вариант 3: Render

1. Создайте аккаунт на [Render](https://render.com)

2. Создайте новый Web Service

3. Подключите GitHub репозиторий

4. Настройте:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Root Directory: `backend`

5. Добавьте PostgreSQL database

6. Настройте переменные окружения

## Настройка базы данных

### PostgreSQL с PostGIS

1. Подключитесь к PostgreSQL:
```bash
sudo -u postgres psql
```

2. Создайте базу данных и пользователя:
```sql
CREATE DATABASE rideshare;
CREATE USER rideshare WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE rideshare TO rideshare;
\c rideshare
CREATE EXTENSION postgis;
```

3. Запустите миграции:
```bash
cd backend
npm run migrate
```

### Резервное копирование

Настройте автоматическое резервное копирование:

```bash
# Создайте скрипт backup.sh
cat > /home/rideshare/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/rideshare/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U rideshare rideshare > $BACKUP_DIR/rideshare_$DATE.sql
# Удалить бэкапы старше 7 дней
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
EOF

chmod +x /home/rideshare/backup.sh

# Добавьте в crontab (каждый день в 2:00)
crontab -e
# Добавьте строку:
0 2 * * * /home/rideshare/backup.sh
```

## Настройка домена и SSL

### Настройка DNS

Добавьте A-записи в настройках вашего домена:

```
A    api.rideshare.example.com    -> IP-адрес VPS
A    rideshare.example.com         -> (автоматически через Vercel/Netlify)
```

### SSL сертификаты с Let's Encrypt

1. Установите Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

2. Получите сертификат:
```bash
sudo certbot --nginx -d api.rideshare.example.com
```

3. Настройте автоматическое обновление:
```bash
sudo certbot renew --dry-run
```

Certbot автоматически добавит задачу в cron для обновления сертификатов.

## Мониторинг и логирование

### PM2 Monitoring

1. Просмотр логов:
```bash
pm2 logs rideshare-backend
```

2. Мониторинг в реальном времени:
```bash
pm2 monit
```

3. Просмотр статуса:
```bash
pm2 status
```

### Настройка логирования

Создайте конфигурацию PM2 с ротацией логов:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Мониторинг с помощью внешних сервисов

#### Sentry (для отслеживания ошибок)

1. Создайте аккаунт на [Sentry](https://sentry.io)

2. Установите SDK:
```bash
npm install @sentry/node
```

3. Добавьте в backend:
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

#### UptimeRobot (для мониторинга доступности)

1. Создайте аккаунт на [UptimeRobot](https://uptimerobot.com)

2. Добавьте мониторы для:
   - Frontend URL
   - Backend API health endpoint

### Health Check Endpoint

Backend уже включает health check endpoint:

```
GET /health
```

Используйте его для мониторинга состояния сервиса.

## Переменные окружения

### Frontend (.env.production)

```env
VITE_API_URL=https://api.rideshare.example.com
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### Backend (.env)

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://rideshare:password@localhost:5432/rideshare
CORS_ORIGIN=https://rideshare.example.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Проверка развертывания

После развертывания проверьте:

1. Frontend доступен по HTTPS
2. Backend API отвечает на запросы
3. База данных подключена
4. SSL сертификаты валидны
5. Логи не содержат ошибок
6. Мониторинг работает

```bash
# Проверка backend
curl https://api.rideshare.example.com/health

# Проверка frontend
curl -I https://rideshare.example.com

# Проверка SSL
openssl s_client -connect api.rideshare.example.com:443 -servername api.rideshare.example.com
```

## Обновление приложения

### Автоматическое (через GitHub Actions)

Просто сделайте push в main ветку - CI/CD автоматически развернет изменения.

### Ручное обновление на VPS

```bash
cd /var/www/rideshare-village
git pull origin main
cd backend
npm ci --production
npm run build
pm2 restart rideshare-backend
```

## Откат к предыдущей версии

### На VPS

```bash
cd /var/www/rideshare-village
git log --oneline  # Найдите нужный коммит
git checkout <commit-hash>
cd backend
npm ci --production
npm run build
pm2 restart rideshare-backend
```

### На Vercel/Netlify

Используйте веб-интерфейс для отката к предыдущему деплою.

## Troubleshooting

### Backend не запускается

1. Проверьте логи:
```bash
pm2 logs rideshare-backend --lines 100
```

2. Проверьте подключение к БД:
```bash
psql -U rideshare -d rideshare -h localhost
```

3. Проверьте переменные окружения:
```bash
pm2 env 0
```

### Frontend не загружается

1. Проверьте build логи в Vercel/Netlify
2. Проверьте переменные окружения
3. Проверьте CORS настройки на backend

### Проблемы с SSL

1. Проверьте сертификат:
```bash
sudo certbot certificates
```

2. Обновите сертификат:
```bash
sudo certbot renew
```

## Дополнительные ресурсы

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Railway Documentation](https://docs.railway.app)
- [PM2 Documentation](https://pm2.keymetrics.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs)
