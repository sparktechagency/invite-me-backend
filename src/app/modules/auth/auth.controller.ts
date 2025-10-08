import httpStatus from 'http-status';
import config from '../../config';
import AppError from '../../error/appError';
import catchAsync from '../../utilities/catchasync';
import { checkIpInRange } from '../../utilities/checkIpInRange';
import { normalizeIp } from '../../utilities/net.util';
import sendResponse from '../../utilities/sendResponse';
import Hotel from '../hotel/hotel.model';
import authServices from './auth.services';

const loginUser = catchAsync(async (req, res) => {
    const result = await authServices.loginUserIntoDB(req.body);
    const { refreshToken } = result;
    res.cookie('refreshToken', refreshToken, {
        secure: config.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60 * 24 * 265,
    });
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User login successfully',
        data: result,
    });
});

const changePassword = catchAsync(async (req, res) => {
    const { ...passwordData } = req.body;
    const result = await authServices.changePasswordIntoDB(
        req.user,
        passwordData
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Password is updated successfully',
        data: result,
    });
});

const refreshToken = catchAsync(async (req, res) => {
    const { refreshToken } = req.cookies;
    const result = await authServices.refreshToken(refreshToken);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Access token is retrieved successfully',
        data: result,
    });
});
const forgetPassword = catchAsync(async (req, res) => {
    const email = req.body.email;
    const result = await authServices.forgetPassword(email);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Password reset code send to the email',
        data: result,
    });
});

const resetPassword = catchAsync(async (req, res) => {
    // const token = req?.headers?.authorization;

    // if (!token) {
    //   throw new AppError(httpStatus.BAD_REQUEST, 'Your token is invalid');
    // }
    const result = await authServices.resetPassword(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Password reset successfully',
        data: result,
    });
});
const verifyResetOtp = catchAsync(async (req, res) => {
    const result = await authServices.verifyResetOtp(
        req.body.email,
        req.body.resetCode
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Reset code verified',
        data: result,
    });
});

const resendResetCode = catchAsync(async (req, res) => {
    const result = await authServices.resendResetCode(req?.body.email);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Reset code resend successfully',
        data: result,
    });
});
const resendVerifyCode = catchAsync(async (req, res) => {
    const result = await authServices.resendVerifyCode(req?.body.email);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Verify code resend successfully',
        data: result,
    });
});

const oAuthLogin = catchAsync(async (req, res) => {
    const { provider, token, role, phoneType, playerId } = req.body;
    if (!['google', 'apple', 'facebook'].includes(provider)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid provider');
    }
    const result = await authServices.loginWithOAuth(
        provider,
        token,
        role,
        phoneType,
        playerId
    );
    res.cookie('refresh-token', result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
    });
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User login successfully',
        data: result,
    });
});
const checkWifiIpRange = catchAsync(async (req, res) => {
    const userIp = normalizeIp(req.ip ?? req.socket.remoteAddress ?? '');

    console.log('User ip========================>', userIp);

    const hotels = await Hotel.find().select('wifiIp').lean();

    const isProduction = process.env.NODE_ENV === 'production';

    let isWifiRangeMatched = true;
    if (isProduction) {
        const matchedHotel = hotels.find((h) =>
            checkIpInRange(userIp, h.wifiIp)
        );
        if (!matchedHotel) {
            isWifiRangeMatched = false;
        }
    }
    console.log('isssisisis', isWifiRangeMatched);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Wi-Fi range check completed',
        data: { isWifiRangeMatched },
    });
});

const authControllers = {
    loginUser,
    changePassword,
    refreshToken,
    forgetPassword,
    resetPassword,
    verifyResetOtp,
    resendResetCode,
    resendVerifyCode,
    oAuthLogin,
    checkWifiIpRange,
};

export default authControllers;
