"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const errorHandler_1 = require("../middleware/errorHandler");
const routeController_1 = require("../controllers/routeController");
const security_1 = require("../middleware/security");
const router = (0, express_1.Router)();
// GET /api/routes/search - поиск маршрутов с геофильтрацией (must be before /:id)
router.get('/search', security_1.searchLimiter, (0, errorHandler_1.asyncHandler)(routeController_1.searchRoutes));
// GET /api/routes/nearby - получение ближайших маршрутов (must be before /:id)
router.get('/nearby', security_1.searchLimiter, (0, errorHandler_1.asyncHandler)(routeController_1.getNearbyRoutes));
// POST /api/routes - создание маршрута
router.post('/', security_1.createRouteLimiter, (0, errorHandler_1.asyncHandler)(routeController_1.createRoute));
// GET /api/routes/:id - получение маршрута
router.get('/:id', (0, errorHandler_1.asyncHandler)(routeController_1.getRoute));
// PUT /api/routes/:id - обновление маршрута
router.put('/:id', (0, errorHandler_1.asyncHandler)(routeController_1.updateRoute));
// DELETE /api/routes/:id - удаление маршрута
router.delete('/:id', (0, errorHandler_1.asyncHandler)(routeController_1.deleteRoute));
exports.default = router;
