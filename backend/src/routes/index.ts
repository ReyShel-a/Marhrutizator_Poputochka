import { Router } from 'express';
import routesRouter from './routes';
import bookingsRouter from './bookings';
import qrRouter from './qr';

const router = Router();

router.use('/routes', routesRouter);
router.use('/bookings', bookingsRouter);
router.use('/qr', qrRouter);

export default router;
