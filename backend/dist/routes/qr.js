"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const errorHandler_1 = require("../middleware/errorHandler");
const qrController_1 = require("../controllers/qrController");
const router = (0, express_1.Router)();
// GET /api/qr/:routeId - получение данных маршрута по QR
router.get('/:routeId', (0, errorHandler_1.asyncHandler)(qrController_1.getRouteByQR));
exports.default = router;
