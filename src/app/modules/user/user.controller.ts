/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import userServices from './user.services';
import { getCloudFrontUrl } from '../../helper/mutler-s3-uploader';
import Hotel from '../hotel/hotel.model';
import { checkIpInRange } from '../../utilities/checkIpInRange';

const registerUser = catchAsync(async (req, res) => {
    // const userIp = req.ip;
    const normalizeIp = (ip: string) => ip.replace(/^::ffff:/, ''); // Normalize IPv6 addresses if necessary
    const headerss: any = req.headers;
    const userIp = normalizeIp(
        Array.isArray(headerss['x-forwarded-for']) // Check if x-forwarded-for is an array
            ? headerss['x-forwarded-for'][0] // Use the first IP if it's an array
            : typeof req.headers['x-forwarded-for'] === 'string' // If it's a string
              ? req.headers['x-forwarded-for'].split(',')[0] // Split the string by commas and use the first IP
              : req.socket.remoteAddress // Fallback to socket's remoteAddress if no x-forwarded-for header
    );

    // const hotelAccessGranted = hotels.some((hotel) =>
    //     checkIpInRange(userIp as string, hotel.wifiIp)
    // );

    // if (!hotelAccessGranted) {
    //     return res
    //         .status(403)
    //         .json({ error: 'Access Denied: Invalid IP for any hotel' });
    // }
    // Find the hotel whose Wi-Fi IP range matches the user's IP

    const hotels = await Hotel.find();
    const matchedHotel = hotels.find((hotel) =>
        checkIpInRange(userIp as string, hotel.wifiIp)
    );

    if (!matchedHotel) {
        return res
            .status(403)
            .json({ error: 'Access Denied: Invalid IP for any hotel' });
    }

    req.body.hotel = matchedHotel._id;

    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
        const matchedHotel = hotels.find((hotel) =>
            checkIpInRange(userIp as string, hotel.wifiIp)
        );

        if (!matchedHotel) {
            return res
                .status(403)
                .json({ error: 'Access Denied: Invalid IP for any hotel' });
        }

        req.body.hotel = matchedHotel._id;
    } else {
        // Development fallback: use a default hotel for testing
        req.body.hotel = hotels[0]?._id; // or a fixed ID
    }

    if (req.files?.pictures) {
        req.body.pictures = req.files.pictures.map((file: any) => {
            return getCloudFrontUrl(file.key);
        });
    }
    const file: any = req.files?.profile_image;
    if (req.files?.profile_image) {
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
