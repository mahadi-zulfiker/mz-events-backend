import express from 'express';
import { FriendController } from './friend.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = express.Router();

router.use(authMiddleware);

router.post('/follow/:userId', FriendController.follow);
router.delete('/unfollow/:userId', FriendController.unfollow);
router.get('/list', FriendController.list);
router.get('/activities', FriendController.activities);

export const FriendRoutes = router;
