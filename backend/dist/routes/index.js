"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const routes_1 = __importDefault(require("./routes"));
const bookings_1 = __importDefault(require("./bookings"));
const qr_1 = __importDefault(require("./qr"));
const router = (0, express_1.Router)();
router.use('/routes', routes_1.default);
router.use('/bookings', bookings_1.default);
router.use('/qr', qr_1.default);
exports.default = router;
