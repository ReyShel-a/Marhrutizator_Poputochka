"use strict";
/**
 * Security middleware - Rate limiting, CORS, and HTTP headers
 * Requirements: 8.3
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.additionalSecurityHeaders = exports.bodySizeLimit = exports.requestLogger = exports.getCorsOptions = exports.helmetConfig = exports.searchLimiter = exports.createBookingLimiter = exports.createRouteLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
/**
 * Rate limiter для общих API запросов
 * Ограничение: 100 запросов за 15 минут с одного IP
 * Requirements: 8.3
 */
exports.generalLimiter = (0, express_rate_limit_1.default)({
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
    skip: (req) => req.path === '/health',
});
/**
 * Строгий rate limiter для создания маршрутов
 * Ограничение: 10 маршрутов за час с одного IP
 * Requirements: 8.3
 */
exports.createRouteLimiter = (0, express_rate_limit_1.default)({
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
exports.createBookingLimiter = (0, express_rate_limit_1.default)({
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
exports.searchLimiter = (0, express_rate_limit_1.default)({
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
exports.helmetConfig = (0, helmet_1.default)({
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
const getCorsOptions = () => {
    const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
        : ['http://localhost:5173', 'http://localhost:3000'];
    return {
        origin: (origin, callback) => {
            // Разрешаем запросы без origin (например, мобильные приложения, Postman)
            if (!origin) {
                return callback(null, true);
            }
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
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
exports.getCorsOptions = getCorsOptions;
/**
 * Middleware для логирования запросов
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();
    const { method, originalUrl, ip } = req;
    // Логируем после завершения ответа
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode } = res;
        const logLevel = statusCode >= 400 ? 'ERROR' : 'INFO';
        console.log(`[${timestamp}] [${logLevel}] ${method} ${originalUrl} - ${statusCode} - ${duration}ms - ${ip}`);
    });
    next();
};
exports.requestLogger = requestLogger;
/**
 * Middleware для проверки размера тела запроса
 */
const bodySizeLimit = (req, res, next) => {
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
exports.bodySizeLimit = bodySizeLimit;
/**
 * Middleware для добавления security headers вручную (дополнительно к helmet)
 */
const additionalSecurityHeaders = (_req, res, next) => {
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
exports.additionalSecurityHeaders = additionalSecurityHeaders;
