/**
 * Security middleware - Rate limiting, CORS, and HTTP headers
 * Requirements: 8.3
 */

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

/**
 * Rate limiter для общих API запросов
 * Ограничение: 100 запросов за 15 минут с одного IP
 * Requirements: 8.3
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов за окно
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Слишком много запросов с этого IP, попробуйте позже',
    },
  },
  standardHeaders: true, // Возвращает rate limit info в заголовках `RateLimit-*`
  legacyHeaders: false, // Отключает заголовки `X-RateLimit-*`
  // Пропускаем rate limiting для health check
  skip: (req: Request) => req.path === '/health',
});

/**
 * Строгий rate limiter для создания маршрутов
 * Ограничение: 10 маршрутов за час с одного IP
 * Requirements: 8.3
 */
export const createRouteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 10, // максимум 10 маршрутов за час
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Слишком много маршрутов создано, попробуйте позже',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Считаем все запросы, даже успешные
});

/**
 * Rate limiter для бронирований
 * Ограничение: 20 бронирований за час с одного IP
 * Requirements: 8.3
 */
export const createBookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 20, // максимум 20 бронирований за час
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Слишком много бронирований создано, попробуйте позже',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter для поисковых запросов
 * Ограничение: 60 запросов за 15 минут с одного IP
 * Requirements: 8.3
 */
export const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 60, // максимум 60 поисковых запросов
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Слишком много поисковых запросов, попробуйте позже',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Helmet конфигурация для безопасных HTTP заголовков
 * Requirements: 8.3
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // Другие заголовки безопасности
  crossOriginEmbedderPolicy: false, // Отключаем для совместимости с внешними ресурсами
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 год
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

/**
 * CORS конфигурация
 * Requirements: 8.3
 */
export const getCorsOptions = () => {
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

  return {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // Разрешаем запросы без origin (например, мобильные приложения, Postman)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-ID'],
    exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    maxAge: 86400, // 24 часа
  };
};

/**
 * Middleware для логирования запросов
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  const { method, originalUrl, ip } = req;

  // Логируем после завершения ответа
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const logLevel = statusCode >= 400 ? 'ERROR' : 'INFO';

    console.log(
      `[${timestamp}] [${logLevel}] ${method} ${originalUrl} - ${statusCode} - ${duration}ms - ${ip}`
    );
  });

  next();
};

/**
 * Middleware для проверки размера тела запроса
 */
export const bodySizeLimit = (req: Request, res: Response, next: NextFunction): void => {
  const contentLength = req.headers['content-length'];

  if (contentLength) {
    const size = parseInt(contentLength, 10);
    const maxSize = 1024 * 1024; // 1 MB

    if (size > maxSize) {
      res.status(413).json({
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Размер запроса превышает допустимый лимит (1 MB)',
        },
      });
      return;
    }
  }

  next();
};

/**
 * Middleware для добавления security headers вручную (дополнительно к helmet)
 */
export const additionalSecurityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  // Запрещаем кэширование чувствительных данных
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Дополнительные заголовки безопасности
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  next();
};
