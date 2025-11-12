import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { getRouteByQR } from '../controllers/qrController';

const router = Router();

// GET /api/qr/:routeId - получение данных маршрута по QR
router.get('/:routeId', asyncHandler(getRouteByQR));

export default router;
