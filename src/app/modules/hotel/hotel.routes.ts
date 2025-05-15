import express, { Request, Response, NextFunction } from 'express';

import HotelController from './hotel.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createHotelZodSchema, updateHotelZodSchema } from './hotel.validation';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import { uploadFile } from '../../helper/mutler-s3-uploader';

const router = express.Router();

router.post(
    '/create',
    auth(USER_ROLE.superAdmin),
    uploadFile(),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(createHotelZodSchema),
    HotelController.createHotel
);

router.get('/get-all/', HotelController.getAllHotels);
router.get('/get-single/:id', HotelController.getSingleHotel);
router.delete('/:id', HotelController.deleteHotel);
router.patch(
    '/update/:id',
    auth(USER_ROLE.superAdmin),
    uploadFile(),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(updateHotelZodSchema),
    HotelController.updateHotel
);

export const hotelRoutes = router;
