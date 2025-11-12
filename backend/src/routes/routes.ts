import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import {
  createRoute,
  getRoute,
  updateRoute,
  deleteRoute,
  searchRoutes,
  getNearbyRoutes,
} from '../controllers/routeController';
import { createRouteLimiter, searchLimiter } from '../middleware/security';

const router = Router();

// GET /api/routes/search - поиск маршрутов с геофильтрацией (must be before /:id)
router.get('/search', searchLimiter, asyncHandler(searchRoutes));

// GET /api/routes/nearby - получение ближайших маршрутов (must be before /:id)
router.get('/nearby', searchLimiter, asyncHandler(getNearbyRoutes));

// POST /api/routes - создание маршрута
router.post('/', createRouteLimiter, asyncHandler(createRoute));

// GET /api/routes/:id - получение маршрута
router.get('/:id', asyncHandler(getRoute));

// PUT /api/routes/:id - обновление маршрута
router.put('/:id', asyncHandler(updateRoute));

// DELETE /api/routes/:id - удаление маршрута
router.delete('/:id', asyncHandler(deleteRoute));

export default router;
