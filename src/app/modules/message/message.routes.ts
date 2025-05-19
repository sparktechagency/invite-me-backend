import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import MessageController from './message.controller';

const router = express.Router();

router.post(
    '/get-messages',
    auth(USER_ROLE.user, USER_ROLE.superAdmin),
    MessageController.getMessages
);

export const messageRoutes = router;
