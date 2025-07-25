/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { User } from '../user/user.model';
import { TLoginUser } from './auth.interface';
import { TUserRole } from '../user/user.interface';
import { createToken, verifyToken } from '../user/user.utils';
import config from '../../config';
import { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import resetPasswordEmailBody from '../../mailTemplate/resetPasswordEmailBody';
import sendEmail from '../../utilities/sendEmail';

import NormalUser from '../normalUser/normalUser.model';
import appleSigninAuth from 'apple-signin-auth';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import mongoose from 'mongoose';
const generateVerifyCode = (): number => {
    return Math.floor(100000 + Math.random() * 900000);
};

const loginUserIntoDB = async (payload: TLoginUser) => {
    const user = await User.findOne({ email: payload.email });
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
    }
    if (user.isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'This user is already deleted'
        );
    }
    if (user.isBlocked) {
        throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
    }
    if (!user.isVerified) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'You are not verified user . Please verify your email'
        );
    }
    // checking if the password is correct ----
    if (!(await User.isPasswordMatched(payload?.password, user?.password))) {
        throw new AppError(httpStatus.FORBIDDEN, 'Password do not match');
    }
    const jwtPayload = {
        id: user?._id,
        profileId: user.profileId,
        email: user?.email,
        role: user?.role as TUserRole,
    };
    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires_in as string
    );
    const refreshToken = createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        config.jwt_refresh_expires_in as string
    );
    return {
        accessToken,
        refreshToken,
        role: user.role,
        profileId: user?.profileId,
    };
};

// change password
const changePasswordIntoDB = async (
    userData: JwtPayload,
    payload: {
        oldPassword: string;
        newPassword: string;
        confirmNewPassword: string;
    }
) => {
    if (payload.newPassword !== payload.confirmNewPassword) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Password and confirm password doesn't match"
        );
    }
    const user = await User.findById(userData.id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
    }
    if (user.isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'This user is already deleted'
        );
    }
    if (user.isBlocked) {
        throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
    }

    if (!(await User.isPasswordMatched(payload?.oldPassword, user?.password))) {
        throw new AppError(httpStatus.FORBIDDEN, 'Password do not match');
    }
    //hash new password
    const newHashedPassword = await bcrypt.hash(
        payload.newPassword,
        Number(config.bcrypt_salt_rounds)
    );
    await User.findOneAndUpdate(
        {
            _id: userData.id,
            role: userData.role,
        },
        {
            password: newHashedPassword,
            passwordChangedAt: new Date(),
        }
    );

    const jwtPayload = {
        id: user?._id,
        profileId: user.profileId,
        email: user?.email,
        role: user?.role as TUserRole,
    };
    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires_in as string
    );
    const refreshToken = createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        config.jwt_refresh_expires_in as string
    );
    return {
        accessToken,
        refreshToken,
    };
};

const refreshToken = async (token: string) => {
    const decoded = verifyToken(token, config.jwt_refresh_secret as string);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { username, email, iat, id } = decoded;
    const user = await User.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
    }
    if (user.isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'This user is already deleted'
        );
    }
    if (user.isBlocked) {
        throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
    }
    if (
        user?.passwordChangedAt &&
        (await User.isJWTIssuedBeforePasswordChange(
            user?.passwordChangedAt,
            iat as number
        ))
    ) {
        throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized');
    }
    const jwtPayload = {
        id: user?._id,
        profileId: user?.profileId,
        email: user?.email,
        role: user?.role as TUserRole,
    };
    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires_in as string
    );
    return { accessToken };
};

// forgot password
const forgetPassword = async (email: string) => {
    const user = await User.findOne({ email: email });
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
    }
    if (user.isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'This user is already deleted'
        );
    }
    if (user.isBlocked) {
        throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
    }

    const resetCode = generateVerifyCode();
    await User.findOneAndUpdate(
        { email: email },
        {
            resetCode: resetCode,
            isResetVerified: false,
            codeExpireIn: new Date(Date.now() + 5 * 60000),
        }
    );

    // sendEmail(
    //   user.email,
    //   'Reset password code',
    //   resetPasswordEmailBody(user.username, resetCode),
    // );
    sendEmail({
        email: user.email,
        subject: 'Reset password code',
        html: resetPasswordEmailBody('Dear', resetCode),
    });

    return null;

    // const jwtPayload = {
    //   id: user?._id,
    //   email: user?.email,
    //   role: user?.role as TUserRole,
    // };
    // const resetToken = createToken(
    //   jwtPayload,
    //   config.jwt_access_secret as string,
    //   '10m',
    // );
    // const resetUiLink = `${config.reset_password_ui_link}?${user._id}&token=${resetToken}`;
    // const emailContent = generateResetPasswordEmail(resetUiLink);

    // // Send the email
    // sendEmail(user?.email, 'Reset your password within 10 mins!', emailContent);
};

// verify forgot otp

const verifyResetOtp = async (email: string, resetCode: number) => {
    const user = await User.findOne({ email: email });
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
    }
    if (user.isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'This user is already deleted'
        );
    }
    if (user.isBlocked) {
        throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
    }

    if (user.codeExpireIn < new Date(Date.now())) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Reset code is expire');
    }
    if (user.resetCode !== Number(resetCode)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Reset code is invalid');
    }
    await User.findOneAndUpdate(
        { email: email },
        { isResetVerified: true },
        { new: true, runValidators: true }
    );
    const jwtPayload = {
        id: user?._id,
        profileId: user?.profileId,
        email: user?.email,
        role: user?.role as TUserRole,
    };
    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires_in as string
    );
    const refreshToken = createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        config.jwt_refresh_expires_in as string
    );
    return {
        accessToken,
        refreshToken,
    };
};

// reset password
const resetPassword = async (payload: {
    email: string;
    password: string;
    confirmPassword: string;
}) => {
    if (payload.password !== payload.confirmPassword) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Password and confirm password doesn't match"
        );
    }
    const user = await User.findOne({ email: payload.email });
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
    }
    if (!user.isResetVerified) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'You need to verify reset code before reset password'
        );
    }

    if (user.isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'This user is already deleted'
        );
    }
    if (user.isBlocked) {
        throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
    }
    // verify token -------------
    // const decoded = jwt.verify(
    //   token,
    //   config.jwt_access_secret as string,
    // ) as JwtPayload;
    // // console.log(decoded.userId, payload.id);
    // if (decoded?.userId !== payload?.email) {
    //   throw new AppError(
    //     httpStatus.FORBIDDEN,
    //     'You are forbidden to access this',
    //   );
    // }

    //hash new password
    const newHashedPassword = await bcrypt.hash(
        payload.password,
        Number(config.bcrypt_salt_rounds)
    );
    // update the new password
    await User.findOneAndUpdate(
        {
            email: payload.email,
        },
        {
            password: newHashedPassword,
            isResetVerified: false,
            passwordChangedAt: new Date(),
        }
    );
    const jwtPayload = {
        id: user?._id,
        profileId: user?.profileId,
        email: user?.email,
        role: user?.role as TUserRole,
    };
    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires_in as string
    );
    const refreshToken = createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        config.jwt_refresh_expires_in as string
    );

    return { accessToken, refreshToken };
};

const resendResetCode = async (email: string) => {
    const user = await User.findOne({ email: email });
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
    }
    if (user.isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'This user is already deleted'
        );
    }
    if (user.isBlocked) {
        throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
    }

    const resetCode = generateVerifyCode();
    await User.findOneAndUpdate(
        { email: email },
        {
            resetCode: resetCode,
            isResetVerified: false,
            codeExpireIn: new Date(Date.now() + 5 * 60000),
        }
    );
    sendEmail({
        email: user.email,
        subject: 'Reset password code',
        html: resetPasswordEmailBody('Dear', resetCode),
    });

    return null;
};
const resendVerifyCode = async (email: string) => {
    const user = await User.findOne({ email: email });
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
    }
    if (user.isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'This user is already deleted'
        );
    }
    if (user.isBlocked) {
        throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
    }

    const verifyCode = generateVerifyCode();
    await User.findOneAndUpdate(
        { email: email },
        {
            verifyCode: verifyCode,
            isVerified: false,
            codeExpireIn: new Date(Date.now() + 5 * 60000),
        }
    );
    sendEmail({
        email: user.email,
        subject: 'Reset password code',
        html: resetPasswordEmailBody('Dear', verifyCode),
    });

    return null;
};
const loginWithOAuth = async (
    provider: string,
    token: string,
    role: TUserRole = 'user',
    phoneType: string
) => {
    let email, id, name, picture;

    const clientId =
        phoneType == 'ios'
            ? process.env.IOS_CLIENT_ID
            : process.env.ANDROID_CLIENT_ID;

    const googleClient = new OAuth2Client(clientId);
    try {
        if (provider === 'google') {
            try {
                const ticket = await googleClient.verifyIdToken({
                    idToken: token,
                    // audience: process.env.GOOGLE_CLIENT_ID,
                    // audience: GOOGLE_CLIENT_IDS,
                    audience: clientId,
                });

                const payload = ticket.getPayload();
                if (!payload) {
                    throw new AppError(400, 'Invalid Google token payload');
                }

                email = payload.email!;
                id = payload.sub;
                name = payload.name!;
                picture = payload.picture!;
            } catch (err: any) {
                if (
                    err.message &&
                    err.message.includes('Wrong recipient, payload audience')
                ) {
                    throw new AppError(
                        401,
                        `Google token audience mismatch. Please check your client ID. ${err.message}`
                    );
                }
                throw new AppError(
                    401,
                    `Google token verification failed: ${err.message}`
                );
            }
        } else if (provider === 'facebook') {
            try {
                const response: any = await axios.get(
                    `https://graph.facebook.com/me?fields=id,email,name,picture&access_token=${token}`
                );

                if (!response.data || !response.data.id) {
                    throw new AppError(
                        400,
                        'Invalid Facebook token or response'
                    );
                }

                email = response.data.email;
                id = response.data.id;
                name = response.data.name;
                picture = response.data.picture?.data?.url || '';
            } catch (err: any) {
                throw new AppError(
                    401,
                    `Facebook token verification failed: ${
                        err.response?.data?.error?.message || err.message
                    }`
                );
            }
        } else if (provider === 'apple') {
            try {
                const appleUser = await appleSigninAuth.verifyIdToken(token, {
                    audience: process.env.APPLE_CLIENT_ID!,
                    ignoreExpiration: false,
                });

                if (!appleUser || !appleUser.sub) {
                    throw new AppError(400, 'Invalid Apple token payload');
                }

                email = appleUser?.email || ' ';
                id = appleUser.sub;
                name = 'Apple User';
                picture = '';
            } catch (err: any) {
                throw new AppError(
                    401,
                    `Apple token verification failed: ${err.message}`
                );
            }
        } else {
            throw new AppError(400, 'Unsupported OAuth provider');
        }

        // Find or create user
        let user = await User.findOne({ [`${provider}Id`]: id });

        // if (!user) {
        //     user = new User({
        //         email,
        //         [`${provider}Id`]: id,
        //         name,
        //         profilePic: picture,
        //         role,
        //         isVerified: true,
        //     });

        //     await user.save();
        //     const nameParts = name.split(' ');
        //     const firstName = nameParts[0];
        //     const lastName = nameParts[1] || '';

        //     const result = await NormalUser.create({
        //         firstName,
        //         lastName,
        //         user: user._id,
        //         email,
        //         profile_image: picture,
        //     });

        //     user = await User.findByIdAndUpdate(
        //         user._id,
        //         { profileId: result._id },
        //         { new: true, runValidators: true }
        //     );
        // }
        if (!user) {
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                user = new User({
                    email,
                    [`${provider}Id`]: id,
                    name,
                    profilePic: picture,
                    role,
                    isVerified: true,
                    loginThough: provider,
                });

                await user.save({ session });

                const nameParts = name.split(' ');
                const firstName = nameParts[0];
                const lastName = nameParts[1] || '';

                const result = await NormalUser.create(
                    [
                        {
                            name: firstName + ' ' + lastName,
                            user: user._id,
                            email,
                            profile_image: picture,
                            hotel: '685cb53494ec9a7c11bcc7f1',
                        },
                    ],
                    { session }
                );

                user = await User.findByIdAndUpdate(
                    user._id,
                    { profileId: result[0]._id },
                    { new: true, runValidators: true, session }
                );

                await session.commitTransaction();
                session.endSession();
                //
            } catch (error: any) {
                await session.abortTransaction();
                session.endSession();
                throw new AppError(
                    httpStatus.SERVICE_UNAVAILABLE,
                    error.message ||
                        'Something went wrong please try again letter'
                );
            }
        }

        if (!user) {
            throw new AppError(404, 'User not found after creation');
        }

        const profile = await NormalUser.findById(user.profileId).select(
            'isRegistrationCompleted'
        );

        // Prepare JWT tokens
        const jwtPayload = {
            id: user._id,
            profileId: user.profileId,
            email: user.email,
            role: user.role as TUserRole,
        };

        const accessToken = createToken(
            jwtPayload,
            config.jwt_access_secret as string,
            config.jwt_access_expires_in as string
        );
        const refreshToken = createToken(
            jwtPayload,
            config.jwt_refresh_secret as string,
            config.jwt_refresh_expires_in as string
        );

        return {
            accessToken,
            refreshToken,
            isRegistrationComplete: profile?.isRegistrationCompleted,
        };
    } catch (error: any) {
        console.error('OAuth login error:', error);

        if (error instanceof AppError) {
            // Forward AppError to frontend with status and message
            throw error;
        }

        // Unknown error fallback
        throw new AppError(500, 'Internal server error during OAuth login');
    }
};

const authServices = {
    loginUserIntoDB,
    changePasswordIntoDB,
    refreshToken,
    forgetPassword,
    resetPassword,
    verifyResetOtp,
    resendResetCode,
    resendVerifyCode,
    loginWithOAuth,
};

export default authServices;
