import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import blockController from './block.controller';
import { uploadFile } from '../../helper/fileUploader';

const router = express.Router();

router.post(
    '/block-unblock-user/:id',
    auth(USER_ROLE.user),
    uploadFile(),
    (req, res, next) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    blockController.blockUnblockUser
);

export const blockRoutes = router;
