/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import cron from 'node-cron';
import AppError from '../../error/appError';
import Connection from '../connection/connection.model';
import Conversation from '../conversation/conversation.model';
import { USER_ROLE } from '../user/user.constant';
import { User } from '../user/user.model';
import { INormalUser } from './normalUser.interface';
import NormalUser from './normalUser.model';
const updateUserProfile = async (id: string, payload: Partial<INormalUser>) => {
    if (payload.email) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'You can not change the email'
        );
    }
    const user = await NormalUser.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'Profile not found');
    }

    if (payload.newPictures) {
        payload.pictures = [...user.pictures, ...payload.newPictures];
    } else {
        payload.pictures = [...user.pictures];
    }
    if (payload?.deletedPictures) {
        payload.pictures = payload.pictures.filter(
            (url) => !payload?.deletedPictures?.includes(url)
        );
    }

    const result = await NormalUser.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });

    return result;
};

const getAllUser = async (
    userData: JwtPayload,
    query: Record<string, unknown>
) => {
    if (userData.role === 'superAdmin' || userData.role === 'admin') {
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 10;
        const skip = (page - 1) * limit;
        const searchTerm = (query.searchTerm as string) || '';
        const sortField = (query.sortBy as string) || 'createdAt';
        const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
        const hotelId = query.hotel
            ? new mongoose.Types.ObjectId(query.hotel as string)
            : null;
        const isBlockFilter =
            query.isBlocked !== undefined ? query.isBlocked === 'true' : null;

        // Set initial matchStage
        const matchStage: any = {
            isRegistrationCompleted: true,
        };

        if (hotelId) {
            matchStage.hotel = hotelId;
        }

        // Normalize today to ignore time
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (query.previousGuest && query.previousGuest == 'true') {
            matchStage.checkOutDate = { $lt: today };
        } else {
            matchStage.checkOutDate = { $gte: today };
        }
        delete query.previousGuest;

        const pipeline: any[] = [];

        pipeline.push({ $match: matchStage });

        // 1. Lookup User to get userDetails
        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'user',
            },
        });
        pipeline.push({ $unwind: '$user' });

        // 2. Filter by isBlocked if filter provided
        if (isBlockFilter !== null) {
            pipeline.push({
                $match: { 'user.isBlocked': isBlockFilter },
            });
        }

        // 3. Search by name or email if searchTerm exists
        if (searchTerm) {
            pipeline.push({
                $match: {
                    $or: [
                        { name: { $regex: searchTerm, $options: 'i' } },
                        { email: { $regex: searchTerm, $options: 'i' } },
                    ],
                },
            });
        }

        // 4. Project limited NormalUser fields and keep hotel id
        pipeline.push({
            $project: {
                _id: 1,
                name: 1,
                email: 1,
                profile_image: 1,
                dateOfBirth: 1,
                hotel: 1,
                user: 1, // keep whole userDetails for now
                checkOutDate: 1,
                checkInDate: 1,
            },
        });

        // 5. Lookup hotel details
        pipeline.push({
            $lookup: {
                from: 'hotels',
                localField: 'hotel',
                foreignField: '_id',
                as: 'hotel',
            },
        });
        pipeline.push({
            $unwind: {
                path: '$hotel',
                preserveNullAndEmptyArrays: true,
            },
        });

        // 6. Final projection: limit userDetails and hotelDetails fields
        pipeline.push({
            $project: {
                _id: 1,
                name: 1,
                email: 1,
                profile_image: 1,
                age: 1,
                checkOutDate: 1,
                checkInDate: 1,
                user: {
                    _id: 1,
                    isBlocked: 1,
                },
                hotel: {
                    _id: 1,
                    name: 1,
                    address: 1,
                    hotel_image: 1,
                    location: 1,
                },
            },
        });

        // 7. Sort
        pipeline.push({
            $sort: {
                [sortField]: sortOrder,
            },
        });

        // 8. Facet for pagination and total count
        pipeline.push({
            $facet: {
                metadata: [{ $count: 'total' }],
                data: [{ $skip: skip }, { $limit: limit }],
            },
        });

        // 9. Unwind metadata and project total count with data
        pipeline.push({
            $unwind: {
                path: '$metadata',
                preserveNullAndEmptyArrays: true,
            },
        });
        pipeline.push({
            $project: {
                data: 1,
                total: { $ifNull: ['$metadata.total', 0] },
            },
        });

        const result = await NormalUser.aggregate(pipeline);

        const users = result[0]?.data || [];
        const total = result[0]?.total || 0;
        const totalPages = Math.ceil(total / limit);

        return {
            meta: {
                page,
                limit,
                total,
                totalPages,
            },
            result: users,
        };
    } else {
        const profileId = userData.profileId; // current user's NormalUser _id as string
        const currentUserId = new mongoose.Types.ObjectId(profileId);

        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 10;
        const skip = (page - 1) * limit;
        const searchTerm = (query.searchTerm as string) || '';
        const sortField = (query.sortBy as string) || 'createdAt';
        const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
        const userProfile = await NormalUser.findOne({ _id: profileId }).select(
            'hotel'
        );

        const hotelId = query.hotel
            ? new mongoose.Types.ObjectId(query.hotel as string)
            : new mongoose.Types.ObjectId(userProfile?.hotel);
        const isBlockFilter =
            query.isBlocked !== undefined ? query.isBlocked === 'true' : null;

        const pipeline: any[] = [];

        // Exclude current user
        pipeline.push({
            $match: {
                _id: { $ne: currentUserId },
                isRegistrationCompleted: true,
                checkOutDate: { $gt: new Date() },
            },
        });

        // Filter by hotel if provided
        if (hotelId) {
            pipeline.push({
                $match: { hotel: hotelId },
            });
        }

        // Lookup User details
        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'user',
            },
        });
        pipeline.push({ $unwind: '$user' });

        // Filter by isBlocked if filter provided
        if (isBlockFilter !== null) {
            pipeline.push({
                $match: { 'user.isBlocked': isBlockFilter },
            });
        }

        // Search by name or email
        if (searchTerm) {
            pipeline.push({
                $match: {
                    $or: [
                        { name: { $regex: searchTerm, $options: 'i' } },
                        { email: { $regex: searchTerm, $options: 'i' } },
                    ],
                },
            });
        }

        // Lookup hotel details
        pipeline.push({
            $lookup: {
                from: 'hotels',
                localField: 'hotel',
                foreignField: '_id',
                as: 'hotel',
            },
        });
        pipeline.push({
            $unwind: { path: '$hotel', preserveNullAndEmptyArrays: true },
        });

        // Lookup Connection with current user
        pipeline.push({
            $lookup: {
                from: 'connections',
                let: { otherUserId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $or: [
                                    {
                                        $and: [
                                            { $eq: ['$sender', currentUserId] },
                                            {
                                                $eq: [
                                                    '$receiver',
                                                    '$$otherUserId',
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        $and: [
                                            {
                                                $eq: [
                                                    '$receiver',
                                                    currentUserId,
                                                ],
                                            },
                                            {
                                                $eq: [
                                                    '$sender',
                                                    '$$otherUserId',
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                ],
                as: 'connection',
            },
        });
        // Optional: unwind connection (can be empty)
        pipeline.push({
            $unwind: {
                path: '$connection',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeline.push({
            $match: {
                $or: [
                    { connection: { $eq: null } }, // no connection
                    { 'connection.status': { $ne: 'ACCEPTED' } }, // not accepted
                ],
            },
        });

        // Lookup block relations
        pipeline.push({
            $lookup: {
                from: 'blocks',
                let: { otherUserId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $or: [
                                    {
                                        $and: [
                                            {
                                                $eq: [
                                                    '$blocker',
                                                    currentUserId,
                                                ],
                                            },
                                            {
                                                $eq: [
                                                    '$blocked',
                                                    '$$otherUserId',
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        $and: [
                                            {
                                                $eq: [
                                                    '$blocked',
                                                    currentUserId,
                                                ],
                                            },
                                            {
                                                $eq: [
                                                    '$blocker',
                                                    '$$otherUserId',
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                ],
                as: 'blockRelation',
            },
        });

        // Filter out those with block relationship
        pipeline.push({
            $match: {
                blockRelation: { $eq: [] },
            },
        });

        // Project only needed fields from NormalUser, user, hotel and full connection
        pipeline.push({
            $project: {
                _id: 1,
                name: 1,
                email: 1,
                profile_image: 1,
                age: 1,
                checkOutDate: 1,
                checkInDate: 1,
                address: 1,
                interests: 1,
                user: {
                    _id: 1,
                    isBlocked: 1,
                },

                hotel: {
                    _id: 1,
                    name: 1,
                    address: 1,
                    hotel_image: 1,
                    location: 1,
                },

                connection: 1, // include full connection document
            },
        });

        // Sort
        pipeline.push({
            $sort: {
                [sortField]: sortOrder,
            },
        });

        // Facet for pagination and total count
        pipeline.push({
            $facet: {
                metadata: [{ $count: 'total' }],
                data: [{ $skip: skip }, { $limit: limit }],
            },
        });

        // Unwind metadata and project total count with data
        pipeline.push({
            $unwind: {
                path: '$metadata',
                preserveNullAndEmptyArrays: true,
            },
        });
        pipeline.push({
            $project: {
                data: 1,
                total: { $ifNull: ['$metadata.total', 0] },
            },
        });

        const result = await NormalUser.aggregate(pipeline);

        const users = result[0]?.data || [];
        const total = result[0]?.total || 0;
        const totalPages = Math.ceil(total / limit);

        return {
            meta: {
                page,
                limit,
                total,
                totalPages,
            },
            result: users,
        };
    }
};

const getSingleUser = async (userData: JwtPayload, id: string) => {
    if (
        userData.role == USER_ROLE.admin ||
        userData.role == USER_ROLE.superAdmin
    ) {
        const result = await NormalUser.findById(id)
            .populate('hotel', 'name')
            .populate('user', 'loginThough');
        if (!result) {
            throw new AppError(httpStatus.NOT_FOUND, 'User not found');
        }

        return result;
    } else {
        const profileId = new mongoose.Types.ObjectId(userData.profileId);
        const targetUserId = new mongoose.Types.ObjectId(id);

        const result = await NormalUser.aggregate([
            { $match: { _id: targetUserId } },
            {
                $lookup: {
                    from: 'connections', // MongoDB collection name
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        {
                                            $and: [
                                                { $eq: ['$sender', profileId] },
                                                {
                                                    $eq: [
                                                        '$receiver',
                                                        '$$userId',
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            $and: [
                                                {
                                                    $eq: [
                                                        '$receiver',
                                                        profileId,
                                                    ],
                                                },
                                                {
                                                    $eq: [
                                                        '$sender',
                                                        '$$userId',
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                        { $project: { status: 1, sender: 1, receiver: 1 } },
                        { $limit: 1 }, // ensures only one connection
                    ],
                    as: 'connectionArray',
                },
            },
            {
                $lookup: {
                    from: 'hotels',
                    localField: 'hotel',
                    foreignField: '_id',
                    as: 'hotel',
                },
            },
            { $unwind: { path: '$hotel', preserveNullAndEmptyArrays: true } },
        ]);

        if (!result || result.length === 0) {
            throw new AppError(httpStatus.NOT_FOUND, 'User not found');
        }

        const user = result[0];

        // convert connection array to single object (or null if no connection)
        const connection =
            user.connectionArray.length > 0 ? user.connectionArray[0] : null;

        // delete the temporary array to clean up the response
        delete user.connectionArray;

        return {
            success: true,
            message: 'User retrieved successfully',
            data: {
                ...user,
                connection,
            },
        };
    }
};

const blockUnblockUser = async (ownId: string, id: string) => {
    const profileId = new mongoose.Types.ObjectId(ownId);
    const userId = new mongoose.Types.ObjectId(id);
    const me = await NormalUser.findById(profileId);
    if (!me) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'Your profile not found , plase try to login again'
        );
    }
    if (!me.blockedUsers.includes(userId)) {
        await NormalUser.findByIdAndUpdate(profileId, {
            $addToSet: { blockedUsers: userId },
        });
        return 1;
    } else {
        await NormalUser.findByIdAndUpdate(profileId, {
            $pull: { blockedUsers: userId },
        });
        return 0;
    }
};

const deleteUser = async (id: string) => {
    const user = await NormalUser.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'Profile not found');
    }

    // Delete associated User document
    if (user.user) {
        await User.findByIdAndDelete(user.user);
    }

    // Delete NormalUser
    const reuslt = await NormalUser.findByIdAndDelete(id);
    return reuslt;
};

// Run every 12 hour
cron.schedule('0 */12 * * *', async () => {
    console.log(
        '[CRON] NormalUser cleanup started at',
        new Date().toISOString()
    );
    const sessionStart = Date.now();

    try {
        const now = new Date();

        // Step 1: Find all expired normal users (not yet marked expired)
        const expiredUsers = await NormalUser.find(
            { checkOutDate: { $lte: now }, isExpired: false },
            { _id: 1, user: 1 } // projection — only get what we need
        ).lean();

        if (!expiredUsers.length) {
            console.log('[CRON] No expired normal users found.');
            return;
        }

        const userIds = expiredUsers.map((u) => u.user).filter(Boolean);
        const normalUserIds = expiredUsers.map((u) => u._id);

        // Step 2: Mark all related users and normal users as expired (bulk update)
        const [userUpdateRes, normalUserUpdateRes] = await Promise.all([
            User.updateMany(
                { _id: { $in: userIds } },
                { $set: { isExpired: true } }
            ),
            NormalUser.updateMany(
                { _id: { $in: normalUserIds } },
                { $set: { isExpired: true } }
            ),
        ]);

        // Step 3: Delete associated connections and conversations in parallel
        const [connDeleteRes, convDeleteRes] = await Promise.all([
            Connection.deleteMany({
                $or: [
                    { sender: { $in: normalUserIds } },
                    { receiver: { $in: normalUserIds } },
                ],
            }),
            Conversation.deleteMany({ participants: { $in: normalUserIds } }),
        ]);

        console.log(
            `[CRON] Marked ${normalUserUpdateRes.modifiedCount} NormalUsers and ${userUpdateRes.modifiedCount} Users as expired.`
        );
        console.log(
            `[CRON] Deleted ${connDeleteRes.deletedCount} connections and ${convDeleteRes.deletedCount} conversations.`
        );
    } catch (error) {
        console.error('[CRON ERROR] NormalUser cleanup failed:', error);
    } finally {
        console.log(
            `[CRON] Cleanup finished in ${(Date.now() - sessionStart) / 1000}s.`
        );
    }
});

const NormalUserServices = {
    updateUserProfile,
    getAllUser,
    getSingleUser,
    // connectionAddRemove,
    // acceptRejectConnectionRequest,
    blockUnblockUser,
    deleteUser,
};

export default NormalUserServices;
