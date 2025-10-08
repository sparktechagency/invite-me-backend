import { NextFunction, Request, Response, Router } from 'express';
import { uploadFile } from '../../helper/mutler-s3-uploader';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import normalUserValidations from '../normalUser/normalUser.validation';
import { USER_ROLE } from './user.constant';
import userControllers from './user.controller';

const router = Router();

router.post(
    '/register-user',
    auth(USER_ROLE.user),
    uploadFile(),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = JSON.parse(req.body.data);
        next();
    },
    validateRequest(normalUserValidations.registerNormalUserValidationSchema),
    userControllers.registerUser
);

router.get(
    '/get-my-profile',
    auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.superAdmin),
    userControllers.getMyProfile
);

router.patch(
    '/change-status/:id',
    auth(USER_ROLE.superAdmin),
    // validateRequest(userValidations.changeUserStatus),
    userControllers.changeUserStatus
);
router.delete(
    '/delete-account',
    auth(USER_ROLE.user),
    userControllers.deleteUserAccount
);

router.get(
    '/get-my-profile',
    auth(USER_ROLE.user, USER_ROLE.superAdmin),
    userControllers.getMyProfile
);

export const userRoutes = router;
