import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import notificationController from './notification.controller';
const router = express.Router();

router.get(
    '/get-notifications',
    auth(USER_ROLE.superAdmin, USER_ROLE.user),
    notificationController.getAllNotification
);
router.patch(
    '/see-notifications',
    auth(USER_ROLE.superAdmin, USER_ROLE.user),
    notificationController.seeNotification
);

router.delete(
    '/delete-notification/:id',
    auth(USER_ROLE.user, USER_ROLE.superAdmin),
    notificationController.deleteNotification
);
router.get(
    '/count',
    auth(USER_ROLE.user),
    notificationController.sendNotificationCountFromDB
);
//
export const notificationRoutes = router;
