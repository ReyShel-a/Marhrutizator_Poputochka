import { AppError } from '../middleware/errorHandler';

export const validateCoordinates = (lat: number, lng: number, fieldName: string = 'coordinates'): void => {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new AppError(400, 'VALIDATION_ERROR', `${fieldName} must be numbers`);
  }
  if (lat < -90 || lat > 90) {
    throw new AppError(400, 'VALIDATION_ERROR', `${fieldName} latitude must be between -90 and 90`);
  }
  if (lng < -180 || lng > 180) {
    throw new AppError(400, 'VALIDATION_ERROR', `${fieldName} longitude must be between -180 and 180`);
  }
};

export const validatePhone = (phone: string): void => {
  if (!phone || typeof phone !== 'string') {
    throw new AppError(400, 'VALIDATION_ERROR', 'Phone number is required');
  }
  // Basic phone validation - at least 10 digits
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Phone number must contain at least 10 digits');
  }
};

export const validateDate = (date: any, fieldName: string = 'date'): Date => {
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new AppError(400, 'VALIDATION_ERROR', `${fieldName} must be a valid date`);
  }
  return parsedDate;
};

export const validatePositiveNumber = (value: any, fieldName: string): number => {
  const num = Number(value);
  if (isNaN(num) || num <= 0) {
    throw new AppError(400, 'VALIDATION_ERROR', `${fieldName} must be a positive number`);
  }
  return num;
};

export const validateRequiredString = (value: any, fieldName: string): string => {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', `${fieldName} is required`);
  }
  return value.trim();
};

export const validateUUID = (id: string, fieldName: string = 'id'): void => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new AppError(400, 'VALIDATION_ERROR', `${fieldName} must be a valid UUID`);
  }
};
