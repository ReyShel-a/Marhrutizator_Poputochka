"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUUID = exports.validateRequiredString = exports.validatePositiveNumber = exports.validateDate = exports.validatePhone = exports.validateCoordinates = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const validateCoordinates = (lat, lng, fieldName = 'coordinates') => {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
        throw new errorHandler_1.AppError(400, 'VALIDATION_ERROR', `${fieldName} must be numbers`);
    }
    if (lat < -90 || lat > 90) {
        throw new errorHandler_1.AppError(400, 'VALIDATION_ERROR', `${fieldName} latitude must be between -90 and 90`);
    }
    if (lng < -180 || lng > 180) {
        throw new errorHandler_1.AppError(400, 'VALIDATION_ERROR', `${fieldName} longitude must be between -180 and 180`);
    }
};
exports.validateCoordinates = validateCoordinates;
const validatePhone = (phone) => {
    if (!phone || typeof phone !== 'string') {
        throw new errorHandler_1.AppError(400, 'VALIDATION_ERROR', 'Phone number is required');
    }
    // Basic phone validation - at least 10 digits
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
        throw new errorHandler_1.AppError(400, 'VALIDATION_ERROR', 'Phone number must contain at least 10 digits');
    }
};
exports.validatePhone = validatePhone;
const validateDate = (date, fieldName = 'date') => {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
        throw new errorHandler_1.AppError(400, 'VALIDATION_ERROR', `${fieldName} must be a valid date`);
    }
    return parsedDate;
};
exports.validateDate = validateDate;
const validatePositiveNumber = (value, fieldName) => {
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
        throw new errorHandler_1.AppError(400, 'VALIDATION_ERROR', `${fieldName} must be a positive number`);
    }
    return num;
};
exports.validatePositiveNumber = validatePositiveNumber;
const validateRequiredString = (value, fieldName) => {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
        throw new errorHandler_1.AppError(400, 'VALIDATION_ERROR', `${fieldName} is required`);
    }
    return value.trim();
};
exports.validateRequiredString = validateRequiredString;
const validateUUID = (id, fieldName = 'id') => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        throw new errorHandler_1.AppError(400, 'VALIDATION_ERROR', `${fieldName} must be a valid UUID`);
    }
};
exports.validateUUID = validateUUID;
