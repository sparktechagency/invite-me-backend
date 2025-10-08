/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../error/appError';
import { checkShouldSendNotification } from '../../helper/checkShouldSendNotification';
import sendNotificationCount from '../../helper/sendNotificationCount';
import { sendSinglePushNotification } from '../../helper/sendPushNotification';
import NormalUser from '../normalUser/normalUser.model';
import { ENUM_NOTIFICATION_TYPE } from '../notification/enum.notification';
import { ENUM_CONNECTION_STATUS } from './connection.enum';
import Connection from './connection.model';
// type
type AcceptRejectStatus =
    | typeof ENUM_CONNECTION_STATUS.ACCEPTED
    | typeof ENUM_CONNECTION_STATUS.REJECTED;
const connectionAddRemove = async (profileId: string, id: string) => {
    const connection = await Connection.findOne({
        $or: [
            { sender: profileId, receiver: id },
            { sender: id, receiver: profileId },
        ],
    });
    const user = await NormalUser.findById(profileId).select('name user');
    if (!user) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'user not found for send notification'
        );
    }
    if (!connection) {
        const result = await Connection.create({
            sender: profileId,
            receiver: id,
        });
        // const notificationData = {
        //     title: 'New connection request',
        //     message: `${user?.name} sent you connection request`,
        //     receiver: id.toString(),
        //     type: ENUM_NOTIFICATION_TYPE.matchNotification,
        // };
        // // TODO: need to add condition for is need to send or not
        // await Notification.create(notificationData);
        // await sendSinglePushNotification(
        //     user!.user.toString(),
        //     'New connection request!',
        //     `${user?.name} sent you connection request`,
        //     { connectionId: result._id }
        // );

        const shouldSend = await checkShouldSendNotification(
            id.toString(),
            ENUM_NOTIFICATION_TYPE.matchNotification
        );

        if (shouldSend) {
            // const notificationData = {
            //     title: 'Someone invites you to connect',
            //     message: `Tap to accept or ignore`,
            //     receiver: id.toString(),
            //     type: ENUM_NOTIFICATION_TYPE.matchNotification,
            // };

            // await Notification.create(notificationData);
            await sendSinglePushNotification(
                user!.user.toString(),
                'Someone invites you to connect',
                `Tap to accept or ignore`,
                { connectionId: result._id }
            );
        }
        sendNotificationCount(user?._id.toString());

        return {
            result,
            message: 'Connection request sent successfully',
        };
    }
    if (connection.sender.equals(profileId)) {
        const result = await Connection.findOneAndDelete({
            sender: profileId,
            receiver: id,
        });
        return {
            result,
            message:
                connection.status == ENUM_CONNECTION_STATUS.PENDING
                    ? 'Connection request withdraw successfully'
                    : 'Connection removed successfully',
        };
    } else {
        if (connection.status == ENUM_CONNECTION_STATUS.PENDING) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "You can't able to add or remove connection with this people because the user already sent you connection request , you should accept or reject"
            );
        } else if (connection.status == ENUM_CONNECTION_STATUS.ACCEPTED) {
            const result = await Connection.findOneAndDelete({
                sender: id,
                receiver: profileId,
            });
            return {
                result,
                message: 'Connection removed successfully',
            };
        }
    }
};

const acceptRejectConnectionRequest = async (
    profileId: string,
    id: string,
    status: AcceptRejectStatus
) => {
    const connection: any = await Connection.findOne({
        _id: id,
        receiver: profileId,
        status: ENUM_CONNECTION_STATUS.PENDING,
    }).populate({ path: 'sender', select: 'name user' });

    if (!connection) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'No pending connection request found from this user.'
        );
    }

    if (status === ENUM_CONNECTION_STATUS.ACCEPTED) {
        connection.status = ENUM_CONNECTION_STATUS.ACCEPTED;
        await connection.save();

        const shouldSend = await checkShouldSendNotification(
            id.toString(),
            ENUM_NOTIFICATION_TYPE.matchNotification
        );
        if (shouldSend) {
            // const notificationData = {
            //     title: 'Someone invites you to connect',
            //     message: `Tap to accept or ignore`,
            //     receiver: id.toString(),
            //     type: ENUM_NOTIFICATION_TYPE.matchNotification,
            // };

            // await Notification.create(notificationData);

            await sendSinglePushNotification(
                connection.sender!.user.toString(),
                `${connection.sender?.name} accepted your invitation`,
                `You’re now connected! Start planning together`,
                { connectionId: connection._id }
            );
        }

        return {
            result: connection,
            message: 'Connection request accepted successfully.',
        };
    } else if (status === ENUM_CONNECTION_STATUS.REJECTED) {
        const result = await Connection.findByIdAndDelete(connection._id);
        return {
            message: 'Connection request rejected',
            result,
        };
    } else {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'Invalid status provided. Use ACCEPTED or REJECTED.'
        );
    }
};

const getAllConnectionRequest = async (
    profileId: string,
    query: Record<string, unknown>
) => {
    const connectionQuery = new QueryBuilder(
        Connection.find({
            status: ENUM_CONNECTION_STATUS.PENDING,
            receiver: profileId,
        }).populate({ path: 'sender', select: 'name profile_image' }),
        query
    )
        .search(['sender.name'])
        .fields()
        .filter()
        .paginate()
        .sort();
    const result = await connectionQuery.modelQuery;
    const meta = await connectionQuery.countTotal();

    return {
        meta,
        result,
    };
};

// const getMyConnections = async (
//     profileId: string,
//     query: Record<string, any>
// ) => {
//     const page = parseInt(query.page as string) || 1;
//     const limit = parseInt(query.limit as string) || 10;
//     const skip = (page - 1) * limit;
//     const searchTerm = (query.searchTerm as string) || '';
//     const sortField = (query.sortBy as string) || 'createdAt';
//     const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

//     const profileObjectId = new mongoose.Types.ObjectId(profileId);

//     const matchStage: any = {
//         $or: [{ sender: profileObjectId }, { receiver: profileObjectId }],
//         status: ENUM_CONNECTION_STATUS.ACCEPTED,
//     };

//     const pipeline: any = [
//         { $match: matchStage },

//         // Add a field "otherUser" which is the user connected to (not profileId)
//         {
//             $addFields: {
//                 otherUser: {
//                     $cond: {
//                         if: { $eq: ['$sender', profileObjectId] },
//                         then: '$receiver',
//                         else: '$sender',
//                     },
//                 },
//             },
//         },

//         // Lookup the other user info
//         {
//             $lookup: {
//                 from: 'normalusers',
//                 localField: 'otherUser',
//                 foreignField: '_id',
//                 as: 'otherUser',
//             },
//         },
//         { $unwind: '$otherUser' },

//         // Search on otherUser.name
//         ...(searchTerm
//             ? [
//                   {
//                       $match: {
//                           'otherUser.name': {
//                               $regex: searchTerm,
//                               $options: 'i',
//                           },
//                       },
//                   },
//               ]
//             : []),

//         { $sort: { [sortField]: sortOrder } },

//         // Pagination
//         { $skip: skip },
//         { $limit: limit },

//         // Project fields: connection fields + otherUser info
//         {
//             $project: {
//                 _id: 1,
//                 status: 1,
//                 createdAt: 1,
//                 updatedAt: 1,
//                 otherUser: {
//                     _id: 1,
//                     name: 1,
//                     profile_image: 1,
//                     email: 1,
//                 },
//             },
//         },
//     ];

//     const results = await Connection.aggregate(pipeline);

//     // Get count for pagination meta
//     const countPipeline = [
//         { $match: matchStage },
//         {
//             $addFields: {
//                 otherUser: {
//                     $cond: {
//                         if: { $eq: ['$sender', profileObjectId] },
//                         then: '$receiver',
//                         else: '$sender',
//                     },
//                 },
//             },
//         },
//         {
//             $lookup: {
//                 from: 'normalusers',
//                 localField: 'otherUser',
//                 foreignField: '_id',
//                 as: 'otherUser',
//             },
//         },
//         { $unwind: '$otherUser' },
//         ...(searchTerm
//             ? [
//                   {
//                       $match: {
//                           'otherUser.name': {
//                               $regex: searchTerm,
//                               $options: 'i',
//                           },
//                       },
//                   },
//               ]
//             : []),
//         { $count: 'total' },
//     ];

//     const countResult = await Connection.aggregate(countPipeline);
//     const total = countResult[0]?.total || 0;
//     const totalPage = Math.ceil(total / limit);

//     return {
//         meta: {
//             page,
//             limit,
//             total,
//             totalPage,
//         },
//         result: results,
//     };
// };
const getMyConnections = async (
    profileId: string,
    query: Record<string, any>
) => {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = (query.searchTerm as string) || '';
    const sortField = (query.sortBy as string) || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const profileObjectId = new mongoose.Types.ObjectId(profileId);

    const matchStage: any = {
        $or: [{ sender: profileObjectId }, { receiver: profileObjectId }],
        status: ENUM_CONNECTION_STATUS.ACCEPTED,
    };

    const pipeline: any[] = [
        { $match: matchStage },

        {
            $addFields: {
                otherUser: {
                    $cond: {
                        if: { $eq: ['$sender', profileObjectId] },
                        then: '$receiver',
                        else: '$sender',
                    },
                },
            },
        },

        {
            $lookup: {
                from: 'normalusers',
                localField: 'otherUser',
                foreignField: '_id',
                as: 'otherUser',
            },
        },
        { $unwind: '$otherUser' },

        ...(searchTerm
            ? [
                  {
                      $match: {
                          'otherUser.name': {
                              $regex: searchTerm,
                              $options: 'i',
                          },
                      },
                  },
              ]
            : []),

        { $sort: { [sortField]: sortOrder } },

        {
            $facet: {
                metadata: [{ $count: 'total' }],
                data: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            _id: 1,
                            status: 1,
                            // createdAt: 1,
                            // updatedAt: 1,
                            otherUser: {
                                _id: 1,
                                name: 1,
                                profile_image: 1,
                                email: 1,
                                age: 1,
                                address: 1,
                            },
                        },
                    },
                ],
            },
        },

        {
            $unwind: {
                path: '$metadata',
                preserveNullAndEmptyArrays: true,
            },
        },

        {
            $project: {
                data: 1,
                total: { $ifNull: ['$metadata.total', 0] },
            },
        },
    ];

    const aggResult = await Connection.aggregate(pipeline);

    const results = aggResult[0]?.data || [];
    const total = aggResult[0]?.total || 0;
    const totalPage = Math.ceil(total / limit);

    return {
        meta: {
            page,
            limit,
            total,
            totalPage,
        },
        result: results,
    };
};
const ConnectionServices = {
    connectionAddRemove,
    acceptRejectConnectionRequest,
    getAllConnectionRequest,
    getMyConnections,
};
export default ConnectionServices;
