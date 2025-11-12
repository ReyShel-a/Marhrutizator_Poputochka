"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const migrations_1 = require("../config/migrations");
const database_1 = require("../config/database");
dotenv_1.default.config();
const migrate = async () => {
    try {
        await (0, migrations_1.runMigrations)();
        console.log('Migration script completed');
        await database_1.pool.end();
        process.exit(0);
    }
    catch (error) {
        console.error('Migration script failed:', error);
        await database_1.pool.end();
        process.exit(1);
    }
};
migrate();
