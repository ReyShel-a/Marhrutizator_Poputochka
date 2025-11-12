"use strict";
/**
 * Authentication middleware - Простая аутентификация на основе device ID
 * Requirements: 6.1, 7.1
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuthRequest = exports.injectDeviceId = exports.validatePhoneInRequest = exports.requireOwnership = exports.requireAuth = exports.optionalAuth = exports.extractPhone = exports.extractDeviceId = void 0;
exports.isValidPhone = isValidPhone;
const errorHandler_1 = require("./errorHandler");
/**
 * Middleware для извлечения device ID из заголовков
 * Requirements: 6.1, 7.1
 */
const extractDeviceId = (req, _res, next) => {
    const deviceId = req.headers['x-device-id'];
    if (deviceId) {
        req.deviceId = deviceId;
    }
    next();
};
exports.extractDeviceId = extractDeviceId;
/**
 * Middleware для извлечения номера телефона из заголовков
 * Requirements: 6.1, 7.1
 */
const extractPhone = (req, _res, next) => {
    const phone = req.headers['x-phone'];
    if (phone) {
        req.phone = phone;
    }
    next();
};
exports.extractPhone = extractPhone;
/**
 * Middleware для проверки наличия device ID (опциональная аутентификация)
 * Не блокирует запрос, только добавляет информацию
 */
const optionalAuth = (req, _res, next) => {
    (0, exports.extractDeviceId)(req, _res, () => {
        (0, exports.extractPhone)(req, _res, next);
    });
};
exports.optionalAuth = optionalAuth;
/**
 * Middleware для обязательной аутентификации
 * Требует наличия device ID в заголовках
 * Requirements: 6.1, 7.1
 */
const requireAuth = (req, _res, next) => {
    const deviceId = req.headers['x-device-id'];
    if (!deviceId) {
        return next((0, errorHandler_1.createUnauthorizedError)('Device ID is required. Please provide X-Device-ID header.'));
    }
    // Валидация формата device ID
    if (!isValidDeviceId(deviceId)) {
        return next((0, errorHandler_1.createUnauthorizedError)('Invalid device ID format'));
    }
    req.deviceId = deviceId;
    // Извлекаем номер телефона если есть
    const phone = req.headers['x-phone'];
    if (phone) {
        req.phone = phone;
    }
    next();
};
exports.requireAuth = requireAuth;
/**
 * Middleware для проверки владельца ресурса
 * Проверяет что device ID в запросе совпадает с device ID ресурса
 */
const requireOwnership = (deviceIdField = 'driver_id') => {
    return (req, _res, next) => {
        const requestDeviceId = req.deviceId;
        if (!requestDeviceId) {
            return next((0, errorHandler_1.createUnauthorizedError)('Authentication required'));
        }
        // Проверяем device ID в теле запроса или параметрах
        const resourceDeviceId = req.body[deviceIdField] || req.params[deviceIdField];
        if (resourceDeviceId && resourceDeviceId !== requestDeviceId) {
            return next((0, errorHandler_1.createUnauthorizedError)('You do not have permission to access this resource'));
        }
        next();
    };
};
exports.requireOwnership = requireOwnership;
/**
 * Валидация формата device ID
 */
function isValidDeviceId(deviceId) {
    if (!deviceId || typeof deviceId !== 'string') {
        return false;
    }
    // Device ID должен быть строкой длиной от 10 до 200 символов
    if (deviceId.length < 10 || deviceId.length > 200) {
        return false;
    }
    // Проверяем что содержит только допустимые символы
    const validPattern = /^[a-zA-Z0-9\-_]+$/;
    return validPattern.test(deviceId);
}
/**
 * Валидация номера телефона (российский формат)
 */
function isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') {
        return false;
    }
    // Удаляем все символы кроме цифр и +
    const cleaned = phone.replace(/[^\d+]/g, '');
    // Проверяем российские форматы
    const patterns = [
        /^\+7\d{10}$/, // +7XXXXXXXXXX
        /^8\d{10}$/, // 8XXXXXXXXXX
        /^7\d{10}$/, // 7XXXXXXXXXX
    ];
    return patterns.some((pattern) => pattern.test(cleaned));
}
/**
 * Middleware для валидации номера телефона в запросе
 */
const validatePhoneInRequest = (req, res, next) => {
    const phone = req.body.passenger_phone || req.body.driver_phone || req.body.phone;
    if (phone && !isValidPhone(phone)) {
        res.status(400).json({
            error: {
                code: 'INVALID_PHONE',
                message: 'Invalid phone number format. Use format: +7XXXXXXXXXX',
            },
        });
        return;
    }
    next();
};
exports.validatePhoneInRequest = validatePhoneInRequest;
/**
 * Middleware для добавления device ID в тело запроса
 * Используется для автоматического добавления driver_id или passenger_id
 */
const injectDeviceId = (field = 'driver_id') => {
    return (req, _res, next) => {
        if (req.deviceId && !req.body[field]) {
            req.body[field] = req.deviceId;
        }
        next();
    };
};
exports.injectDeviceId = injectDeviceId;
/**
 * Middleware для логирования аутентифицированных запросов
 */
const logAuthRequest = (req, _res, next) => {
    if (req.deviceId) {
        const timestamp = new Date().toISOString();
        const { method, originalUrl } = req;
        const phone = req.phone ? ` (${req.phone})` : '';
        console.log(`[${timestamp}] [AUTH] ${method} ${originalUrl} - Device: ${req.deviceId}${phone}`);
    }
    next();
};
exports.logAuthRequest = logAuthRequest;
