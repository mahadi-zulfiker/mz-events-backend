"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = require("../modules/Auth/auth.routes");
const user_routes_1 = require("../modules/Users/user.routes");
const event_routes_1 = require("../modules/Events/event.routes");
const participant_routes_1 = require("../modules/Participants/participant.routes");
const review_routes_1 = require("../modules/Reviews/review.routes");
const payment_routes_1 = require("../modules/Payments/payment.routes");
const admin_routes_1 = require("../modules/Admin/admin.routes");
const router = (0, express_1.Router)();
const moduleRoutes = [
    { path: '/auth', route: auth_routes_1.AuthRoutes },
    { path: '/users', route: user_routes_1.UserRoutes },
    { path: '/events', route: event_routes_1.EventRoutes },
    { path: '/events', route: participant_routes_1.ParticipantRoutes },
    { path: '/reviews', route: review_routes_1.ReviewRoutes },
    { path: '/payments', route: payment_routes_1.PaymentRoutes },
    { path: '/admin', route: admin_routes_1.AdminRoutes },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
