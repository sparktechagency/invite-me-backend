import { Router } from 'express';
import { userRoutes } from '../modules/user/user.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { ManageRoutes } from '../modules/manage-web/manage.routes';
import { normalUserRoutes } from '../modules/normalUser/normalUser.routes';
import { notificationRoutes } from '../modules/notification/notification.routes';
import { bannerRoutes } from '../modules/banner/banner.routes';
import { metaRoutes } from '../modules/meta/meta.routes';
import { feedbackRoutes } from '../modules/feedback/feedback.routes';
import { AdminRoutes } from '../modules/admin/admin.routes';
import { hotelRoutes } from '../modules/hotel/hotel.routes';
import { superAdminRoutes } from '../modules/superAdmin/superAdmin.routes';
import { connectionRoutes } from '../modules/connection/connection.routes';
import { reportRoutes } from '../modules/report/report.routes';
import { conversationRoutes } from '../modules/conversation/conversation.routes';
import { messageRoutes } from '../modules/message/message.routes';

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
];

moduleRoutes.forEach((route) => router.use(route.path, route.router));

export default router;
