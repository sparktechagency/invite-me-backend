import { Router } from 'express';
import { AdminRoutes } from '../modules/admin/admin.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { bannerRoutes } from '../modules/banner/banner.routes';
import { blockRoutes } from '../modules/block/block.routes';
import { connectionRoutes } from '../modules/connection/connection.routes';
import { conversationRoutes } from '../modules/conversation/conversation.routes';
import { feedbackRoutes } from '../modules/feedback/feedback.routes';
import { hotelRoutes } from '../modules/hotel/hotel.routes';
import { ManageRoutes } from '../modules/manage-web/manage.routes';
import { messageRoutes } from '../modules/message/message.routes';
import { metaRoutes } from '../modules/meta/meta.routes';
import { normalUserRoutes } from '../modules/normalUser/normalUser.routes';
import { notificationRoutes } from '../modules/notification/notification.routes';
import { notificationSettingRoutes } from '../modules/notificationSetting/notificationSetting.routes';
import { reportRoutes } from '../modules/report/report.routes';
import { superAdminRoutes } from '../modules/superAdmin/superAdmin.routes';
import { userRoutes } from '../modules/user/user.routes';

const router = Router();

const moduleRoutes = [
    {
        path: '/auth',
        router: authRoutes,
    },
    {
        path: '/user',
        router: userRoutes,
    },
    {
        path: '/normal-user',
        router: normalUserRoutes,
    },

    {
        path: '/manage',
        router: ManageRoutes,
    },
    {
        path: '/notification',
        router: notificationRoutes,
    },

    {
        path: '/banner',
        router: bannerRoutes,
    },
    {
        path: '/meta',
        router: metaRoutes,
    },
    {
        path: '/feedback',
        router: feedbackRoutes,
    },
    {
        path: '/admin',
        router: AdminRoutes,
    },
    {
        path: '/hotel',
        router: hotelRoutes,
    },
    {
        path: '/super-admin',
        router: superAdminRoutes,
    },
    {
        path: '/connection',
        router: connectionRoutes,
    },
    {
        path: '/report',
        router: reportRoutes,
    },
    {
        path: '/meta',
        router: metaRoutes,
    },
    {
        path: '/conversation',
        router: conversationRoutes,
    },
    {
        path: '/message',
        router: messageRoutes,
    },
    {
        path: '/block',
        router: blockRoutes,
    },
    {
        path: '/notificationSetting',
        router: notificationSettingRoutes,
    },
];

moduleRoutes.forEach((route) => router.use(route.path, route.router));

export default router;
