/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import userServices from './user.services';
import { getCloudFrontUrl } from '../../helper/mutler-s3-uploader';
import Hotel from '../hotel/hotel.model';
import { checkIpInRange } from '../../utilities/checkIpInRange';
import AppError from '../../error/appError';
import { normalizeIp } from '../../utilities/net.util';

// const registerUser = catchAsync(async (req, res) => {
//     // const userIp = req.ip;
//     const normalizeIp = (ip: string) => ip.replace(/^::ffff:/, '');
//     const headerss: any = req.headers;
//     const userIp = normalizeIp(
//         Array.isArray(headerss['x-forwarded-for'])
//             ? headerss['x-forwarded-for'][0]
//             : typeof req.headers['x-forwarded-for'] === 'string'
//               ? req.headers['x-forwarded-for'].split(',')[0]
//               : req.socket.remoteAddress
//     );

//     const hotels = await Hotel.find();

//     const isProduction = process.env.NODE_ENV === 'production';
//     // const isProduction = true;

//     if (isProduction) {
//         const matchedHotel = hotels.find((hotel) =>
//             checkIpInRange(userIp as string, hotel.wifiIp)
//         );

//         if (!matchedHotel) {
//             throw new AppError(
//                 httpStatus.BAD_REQUEST,
//                 'Access Denied: Please connect our hotel wifi for registration'
//             );
//         }

//         req.body.hotel = matchedHotel._id;
//     } else {
//         // Development fallback: use a default hotel for testing
//         req.body.hotel = hotels[0]?._id; // or a fixed ID
//     }

//     if (req.files?.pictures) {
//         req.body.pictures = req.files.pictures.map((file: any) => {
//             return getCloudFrontUrl(file.key);
//         });
//     }
//     const file: any = req.files?.profile_image;
//     if (req.files?.profile_image) {
//         req.body.profile_image = getCloudFrontUrl(file[0].key);
//     }
//     const result = await userServices.registerUser(
//         req.user.profileId,
//         req.body
//     );
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: 'Your registration is successfully completed',
//         data: result,
//     });
// });

const registerUser = catchAsync(async (req, res) => {
    // If trust proxy is set, req.ip is already sanitized by Express
    const raw =
        (req.headers['x-forwarded-for'] as string | undefined)
            ?.split(',')[0]
            ?.trim() ??
        req.socket.remoteAddress ??
        req.ip;

    const userIp = normalizeIp(raw || '');

    console.log('User ip========================>', userIp);

    const hotels = await Hotel.find().lean();

    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
        const matchedHotel = hotels.find((h) =>
            checkIpInRange(userIp, h.wifiIp)
        );
        if (!matchedHotel) {
            throw new AppError(
                httpStatus.FORBIDDEN,
                'Access denied. Please connect to the hotel Wi-Fi to register.'
            );
        }
        req.body.hotel = matchedHotel._id;
    } else {
        if (!hotels.length) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                'No hotels exist. Add one before testing.'
            );
        }
        req.body.hotel = hotels[0]._id;
    }

    // File handling
    if (req.files?.pictures) {
        req.body.pictures = req.files.pictures.map((file: any) =>
            getCloudFrontUrl(file.key)
        );
    }
    if (req.files?.profile_image) {
        const file: any[] = req.files.profile_image;
        req.body.profile_image = getCloudFrontUrl(file[0].key);
    }

    const result = await userServices.registerUser(
        req.user.profileId,
        req.body
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Your registration is successfully completed',
        data: result,
    });
});
const getMyProfile = catchAsync(async (req, res) => {
    const clientIp =
        req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('client ip', clientIp);
    const result = await userServices.getMyProfile(req.user);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Successfully retrieved your data',
        data: result,
    });
});
const changeUserStatus = catchAsync(async (req, res) => {
    const result = await userServices.changeUserStatus(req.params.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `User is ${result?.isBlocked ? 'Blocked' : 'Unblocked'}`,
        data: result,
    });
});
const deleteUserAccount = catchAsync(async (req, res) => {
    const result = await userServices.deleteUserAccount(
        req.user,
        req.body.password
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Your account deleted successfully`,
        data: result,
    });
});

const userController = {
    registerUser,
    getMyProfile,
    changeUserStatus,
    deleteUserAccount,
};
export default userController;
