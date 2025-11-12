"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const database_1 = require("./config/database");
const security_1 = require("./middleware/security");
const auth_1 = require("./middleware/auth");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Security middleware
app.use(security_1.helmetConfig);
app.use((0, cors_1.default)((0, security_1.getCorsOptions)()));
app.use(security_1.requestLogger);
app.use(security_1.bodySizeLimit);
app.use(security_1.additionalSecurityHeaders);
// Rate limiting
app.use(security_1.generalLimiter);
// Body parsing middleware
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
// Authentication middleware (optional - extracts device ID if present)
app.use(auth_1.optionalAuth);
app.use(auth_1.logAuthRequest);
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API routes
app.use('/api', routes_1.default);
// Error handling
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
// Test database connection
database_1.pool.query('SELECT NOW()')
    .then(() => {
    console.log('Database connected successfully');
})
    .catch((err) => {
    console.error('Database connection error:', err);
});
// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await database_1.pool.end();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    await database_1.pool.end();
    process.exit(0);
});
