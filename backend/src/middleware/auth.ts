/**
 * Authentication middleware - Простая аутентификация на основе device ID
 * Requirements: 6.1, 7.1
 */

import { Request, Response, NextFunction } from 'express';
import { createUnauthorizedError } from './errorHandler';

// Расширяем Request для добавления auth информации
declare global {
  namespace Express {
    interface Request {
      deviceId?: string;
      phone?: string;
    }
  }
}

/**
 * Middleware для извлечения device ID из заголовков
 * Requirements: 6.1, 7.1
 */
export const extractDeviceId = (req: Request, _res: Response, next: NextFunction) => {
  const deviceId = req.headers['x-device-id'] as string;

  if (deviceId) {
    req.deviceId = deviceId;
  }

  next();
};

/**
 * Middleware для извлечения номера телефона из заголовков
 * Requirements: 6.1, 7.1
 */
export const extractPhone = (req: Request, _res: Response, next: NextFunction) => {
  const phone = req.headers['x-phone'] as string;

  if (phone) {
    req.phone = phone;
  }

  next();
};

/**
 * Middleware для проверки наличия device ID (опциональная аутентификация)
 * Не блокирует запрос, только добавляет информацию
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  extractDeviceId(req, _res, () => {
    extractPhone(req, _res, next);
  });
};

/**
 * Middleware для обязательной аутентификации
 * Требует наличия device ID в заголовках
 * Requirements: 6.1, 7.1
 */
export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const deviceId = req.headers['x-device-id'] as string;

  if (!deviceId) {
    return next(
      createUnauthorizedError('Device ID is required. Please provide X-Device-ID header.')
    );
  }

  // Валидация формата device ID
  if (!isValidDeviceId(deviceId)) {
    return next(createUnauthorizedError('Invalid device ID format'));
  }

  req.deviceId = deviceId;

  // Извлекаем номер телефона если есть
  const phone = req.headers['x-phone'] as string;
  if (phone) {
    req.phone = phone;
  }

  next();
};

/**
 * Middleware для проверки владельца ресурса
 * Проверяет что device ID в запросе совпадает с device ID ресурса
 */
export const requireOwnership = (deviceIdField: string = 'driver_id') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const requestDeviceId = req.deviceId;

    if (!requestDeviceId) {
      return next(createUnauthorizedError('Authentication required'));
    }

    // Проверяем device ID в теле запроса или параметрах
    const resourceDeviceId = req.body[deviceIdField] || req.params[deviceIdField];

    if (resourceDeviceId && resourceDeviceId !== requestDeviceId) {
      return next(
        createUnauthorizedError('You do not have permission to access this resource')
      );
    }

    next();
  };
};

/**
 * Валидация формата device ID
 */
function isValidDeviceId(deviceId: string): boolean {
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
export function isValidPhone(phone: string): boolean {
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
export const validatePhoneInRequest = (req: Request, res: Response, next: NextFunction): void => {
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

/**
 * Middleware для добавления device ID в тело запроса
 * Используется для автоматического добавления driver_id или passenger_id
 */
export const injectDeviceId = (field: string = 'driver_id') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.deviceId && !req.body[field]) {
      req.body[field] = req.deviceId;
    }
    next();
  };
};

/**
 * Middleware для логирования аутентифицированных запросов
 */
export const logAuthRequest = (req: Request, _res: Response, next: NextFunction) => {
  if (req.deviceId) {
    const timestamp = new Date().toISOString();
    const { method, originalUrl } = req;
    const phone = req.phone ? ` (${req.phone})` : '';

    console.log(
      `[${timestamp}] [AUTH] ${method} ${originalUrl} - Device: ${req.deviceId}${phone}`
    );
  }

  next();
};
