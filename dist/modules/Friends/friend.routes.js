"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendRoutes = void 0;
const express_1 = __importDefault(require("express"));
const friend_controller_1 = require("./friend.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.authMiddleware);
router.post('/follow/:userId', friend_controller_1.FriendController.follow);
router.delete('/unfollow/:userId', friend_controller_1.FriendController.unfollow);
router.get('/list', friend_controller_1.FriendController.list);
router.get('/activities', friend_controller_1.FriendController.activities);
exports.FriendRoutes = router;
