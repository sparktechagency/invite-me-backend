import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import notificationSettingController from './notificationSetting.controller';
const router = express.Router();

router.patch(
    '/update',
    auth(USER_ROLE.superAdmin, USER_ROLE.user),
    notificationSettingController.updateNotificationSetting
);

router.get(
    '/get',
    auth(USER_ROLE.superAdmin, USER_ROLE.user),
    notificationSettingController.getNotificationSetting
);

export const notificationSettingRoutes = router;
