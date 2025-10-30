"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const express_1 = require("express");
const health_controller_1 = require("../controllers/health.controller");
const router = (0, express_1.Router)();
exports.healthRoutes = router;
const healthController = new health_controller_1.HealthController();
router.get('/', healthController.health);
router.get('/ready', healthController.ready);
router.get('/metrics', healthController.metrics);
//# sourceMappingURL=health.routes.js.map