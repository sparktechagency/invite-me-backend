import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import ConversationController from './conversation.controller';

const router = express.Router();

router.get(
    '/get-chat-list',
    auth(USER_ROLE.user, USER_ROLE.superAdmin),
    ConversationController.getChatList
);

export const conversationRoutes = router;
