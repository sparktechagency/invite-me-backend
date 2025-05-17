import { NextFunction, Request, Response, Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import AdminValidations from './admin.validation';
import AdminController from './admin.controller';
import { uploadFile } from '../../helper/mutler-s3-uploader';

const router = Router();

router.post(
    '/create-admin',
    validateRequest(AdminValidations.createAdminValidatoinSchema),
    AdminController.createAdmin
);

router.patch(
    '/update-admin/:id',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    uploadFile(),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }

        next();
    },
    validateRequest(AdminValidations.updateAdminProfileValidationSchema),
    AdminController.updateAdminProfile
);

router.delete(
    '/delete-admin/:id',
    auth(USER_ROLE.superAdmin),
    AdminController.deleteAdmin
);

router.patch(
    '/update-admin-status/:id',
    auth(USER_ROLE.superAdmin),
    AdminController.updateAdminStatus
);

router.get(
    '/all-admins',
    auth(USER_ROLE.superAdmin),
    AdminController.getAllAdmin
);

export const AdminRoutes = router;
