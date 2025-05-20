import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import connectionController from './connection.controller';

const router = express.Router();

router.post(
    '/add-remove/:id',
    auth(USER_ROLE.user),
    connectionController.addRemoveConnection
);
router.post(
    '/accept-reject/:id',
    auth(USER_ROLE.user),
    connectionController.accpetRejectConnectionRequest
);
router.get(
    '/get-requests',
    auth(USER_ROLE.user),
    connectionController.getAllConnectionRequest
);
router.get(
    '/my-connections',
    auth(USER_ROLE.user),
    connectionController.getMyConnections
);

export const connectionRoutes = router;
