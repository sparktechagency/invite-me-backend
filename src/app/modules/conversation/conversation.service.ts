/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from 'mongoose';

import calculatePagination from '../../helper/paginationHelper';
import pick from '../../helper/pick';

import Conversation from './conversation.model';

// const getConversation = async (
//   profileId: string,
//   query: Record<string, unknown>,
// ) => {
//   const searchTerm = query.searchTerm as string;
//   let userSearchFilter = {};

//   if (searchTerm) {
//     const matchingUsers = await User.find(
//       { name: { $regex: searchTerm, $options: 'i' } },
//       '_id',
//     );

//     const matchingUserIds = matchingUsers.map((user) => user._id);

//     userSearchFilter = {
//       participants: { $in: matchingUserIds },
//     };
//   }

//   const currentUserConversationQuery = new QueryBuilder(
//     Conversation.find({
//       participants: profileId,
//       ...userSearchFilter,
//     })
//       .sort({ updatedAt: -1 })
//       .populate({
//         path: 'participants',
//         select: 'name profile_image _id email',
//       })
//       .populate('lastMessage'),
//     query,
//   )
//     .fields()
//     .filter()
//     .paginate()
//     .sort();

//   const currentUserConversation = await currentUserConversationQuery.modelQuery;
//   const conversationList = await Promise.all(
//     currentUserConversation.map(async (conv: any) => {
//       const countUnseenMessage = await Message.countDocuments({
//         conversationId: conv._id,
//         msgByUserId: { $ne: profileId },
//         seen: false,
//       });
//       const otherUser = conv.participants.find(
//         (participant: any) => participant._id.toString() != profileId,
//       );
//       return {
//         _id: conv?._id,
//         userData: {
//           _id: otherUser?._id,
//           name: otherUser?.name,
//           profileImage: otherUser?.profile_image,
//           email: otherUser?.email,
//         },
//         unseenMsg: countUnseenMessage,
//         lastMsg: conv.lastMessage,
//       };
//     }),
//   );

//   const meta = await currentUserConversationQuery.countTotal();

//   return {
//     meta,
//     result: conversationList,
//   };
// };

// const getConversation = async (
//     profileId: string,
//     query: Record<string, unknown>
// ) => {
//     console.log('profileId', profileId);
//     const filters = pick(query, ['searchTerm', 'email', 'name']);

//     const paginationOptions = pick(query, [
//         'page',
//         'limit',
//         'sortBy',
//         'sortOrder',
//     ]);

//     const { searchTerm } = filters;
//     //
//     const {
//         page,
//         limit = 10,
//         skip,
//         sortBy,
//         sortOrder,
//     } = calculatePagination(paginationOptions);
//     const sortConditions: { [key: string]: 1 | -1 } = {};
//     if (sortBy && sortOrder) {
//         sortConditions[sortBy] = sortOrder === 'asc' ? 1 : -1;
//     }

//     // search condition------------
//     const searchConditions = [];
//     if (searchTerm) {
//         searchConditions.push({
//             $or: ['otherUser.name', 'otherUser.email'].map((field) => ({
//                 [field]: { $regex: searchTerm, $options: 'i' },
//             })),
//         });
//     }

//     const pipeline: any[] = [
//         {
//             $match: {
//                 participants: new Types.ObjectId(profileId),
//             },
//         },
//         {
//             $lookup: {
//                 from: 'messages',
//                 localField: 'lastMessage',
//                 foreignField: '_id',
//                 as: 'lastMessage',
//             },
//         },
//         {
//             $unwind: {
//                 path: '$lastMessage',
//                 preserveNullAndEmptyArrays: true,
//             },
//         },
//         {
//             $lookup: {
//                 from: 'normalusers',
//                 let: { participants: '$participants' },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     {
//                                         $in: ['$_id', '$$participants'],
//                                     },
//                                     {
//                                         $ne: [
//                                             '$_id',
//                                             new Types.ObjectId(profileId),
//                                         ],
//                                     },
//                                 ],
//                             },
//                         },
//                     },
//                     {
//                         $limit: 1,
//                     },
//                 ],
//                 as: 'otherUser',
//             },
//         },
//         {
//             $unwind: '$otherUser',
//         },
//         {
//             $lookup: {
//                 from: 'messages',
//                 let: { conversationId: '$_id' },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     {
//                                         $eq: [
//                                             '$conversationId',
//                                             '$$conversationId',
//                                         ],
//                                     },
//                                     { $eq: ['$seen', false] },
//                                     {
//                                         $ne: [
//                                             '$msgByUserId',
//                                             new Types.ObjectId(profileId),
//                                         ],
//                                     },
//                                 ],
//                             },
//                         },
//                     },
//                     {
//                         $count: 'unreadCount',
//                     },
//                 ],
//                 as: 'unreadCountData',
//             },
//         },
//         {
//             $unwind: {
//                 path: '$unreadCountData',
//                 preserveNullAndEmptyArrays: true,
//             },
//         },

//         {
//             ...(searchTerm
//                 ? {
//                       $match: {
//                           $or: [
//                               {
//                                   'otherUser.name': {
//                                       $regex: searchTerm,
//                                       $options: 'i',
//                                   },
//                               },
//                               {
//                                   'otherUser.email': {
//                                       $regex: searchTerm,
//                                       $options: 'i',
//                                   },
//                               },
//                           ],
//                       },
//                   }
//                 : {}),
//         },
//         {
//             $project: {
//                 _id: 1,
//                 type: '$type',
//                 userData: {
//                     _id: '$otherUser._id',
//                     email: '$otherUser.email',
//                     name: '$otherUser.name',
//                     profile_image: '$otherUser.profile_image',
//                 },
//                 // project: {
//                 //   _id: 1,
//                 //   title: 1,
//                 //   name: 1,
//                 //   projectImage: 1,
//                 // },
//                 lastMessage: 1,
//                 created_at: '$createdAt',
//                 updated_at: '$updatedAt',
//                 unseenMsg: { $ifNull: ['$unreadCountData.unreadCount', 0] },
//             },
//         },

//         {
//             // $sort: { 'lastMessage.createdAt': -1 },
//             $sort: { updated_at: -1 },
//         },
//         { $skip: skip },
//         { $limit: limit },
//     ];

//     const [results, totalCount] = await Promise.all([
//         Conversation.aggregate(pipeline),
//         Conversation.aggregate([...pipeline.slice(0, -2), { $count: 'total' }]),
//     ]);
//     console.log('result', results, totalCount);
//     const total = totalCount[0]?.total || 0;
//     return {
//         meta: {
//             page,
//             limit,
//             total,
//             totalPage: Math.ceil(total / limit),
//         },
//         data: results,
//     };
// };
const getConversation = async (
    profileId: string,
    query: Record<string, unknown>
) => {
    console.log('profileId', profileId);

    const filters = pick(query, ['searchTerm', 'email', 'name']);
    const paginationOptions = pick(query, [
        'page',
        'limit',
        'sortBy',
        'sortOrder',
    ]);
    const { searchTerm } = filters;

    const {
        page,
        limit = 10,
        skip,
        sortBy,
        sortOrder,
    } = calculatePagination(paginationOptions);

    const sortConditions: { [key: string]: 1 | -1 } = {};
    if (sortBy && sortOrder) {
        sortConditions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    const pipeline: any[] = [
        {
            $match: {
                participants: new Types.ObjectId(profileId),
            },
        },
        {
            $lookup: {
                from: 'messages',
                localField: 'lastMessage',
                foreignField: '_id',
                as: 'lastMessage',
            },
        },
        {
            $unwind: {
                path: '$lastMessage',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: 'normalusers',
                let: { participants: '$participants' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $in: ['$_id', '$$participants'] },
                                    {
                                        $ne: [
                                            '$_id',
                                            new Types.ObjectId(profileId),
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                    { $limit: 1 },
                ],
                as: 'otherUser',
            },
        },
        {
            $unwind: '$otherUser',
        },

        // Add block lookup: if current user blocked other user
        {
            $lookup: {
                from: 'blocks',
                let: {
                    currentUserId: new Types.ObjectId(profileId),
                    otherUserId: '$otherUser._id',
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$blocker', '$$currentUserId'] },
                                    { $eq: ['$blocked', '$$otherUserId'] },
                                ],
                            },
                        },
                    },
                    { $limit: 1 },
                ],
                as: 'blockedByMe',
            },
        },
        // Add block lookup: if other user blocked current user
        {
            $lookup: {
                from: 'blocks',
                let: {
                    currentUserId: new Types.ObjectId(profileId),
                    otherUserId: '$otherUser._id',
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$blocker', '$$otherUserId'] },
                                    { $eq: ['$blocked', '$$currentUserId'] },
                                ],
                            },
                        },
                    },
                    { $limit: 1 },
                ],
                as: 'blockedMe',
            },
        },

        {
            $lookup: {
                from: 'messages',
                let: { conversationId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {
                                        $eq: [
                                            '$conversationId',
                                            '$$conversationId',
                                        ],
                                    },
                                    { $eq: ['$seen', false] },
                                    {
                                        $ne: [
                                            '$msgByUserId',
                                            new Types.ObjectId(profileId),
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                    { $count: 'unreadCount' },
                ],
                as: 'unreadCountData',
            },
        },
        {
            $unwind: {
                path: '$unreadCountData',
                preserveNullAndEmptyArrays: true,
            },
        },
        ...(searchTerm
            ? [
                  {
                      $match: {
                          $or: [
                              {
                                  'otherUser.name': {
                                      $regex: searchTerm,
                                      $options: 'i',
                                  },
                              },
                              {
                                  'otherUser.email': {
                                      $regex: searchTerm,
                                      $options: 'i',
                                  },
                              },
                          ],
                      },
                  },
              ]
            : []),
        {
            $project: {
                _id: 1,
                type: '$type',
                userData: {
                    _id: '$otherUser._id',
                    email: '$otherUser.email',
                    name: '$otherUser.name',
                    profile_image: '$otherUser.profile_image',
                },
                lastMessage: 1,
                created_at: '$createdAt',
                updated_at: '$updatedAt',
                unseenMsg: { $ifNull: ['$unreadCountData.unreadCount', 0] },
                isBlockedByMe: {
                    $cond: {
                        if: { $gt: [{ $size: '$blockedByMe' }, 0] },
                        then: true,
                        else: false,
                    },
                },
                isBlockedMe: {
                    $cond: {
                        if: { $gt: [{ $size: '$blockedMe' }, 0] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $sort:
                sortConditions && Object.keys(sortConditions).length > 0
                    ? sortConditions
                    : { updated_at: -1 },
        },
        { $skip: skip },
        { $limit: limit },
    ];

    // const [results, totalCount] = await Promise.all([
    //     Conversation.aggregate(pipeline),
    //     Conversation.aggregate([...pipeline.slice(0, -2), { $count: 'total' }]),
    // ]);

    // const total = totalCount[0]?.total || 0;

    // return {
    //     meta: {
    //         page,
    //         limit,
    //         total,
    //         totalPage: Math.ceil(total / limit),
    //     },
    //     data: results,
    // };

    const [results, totalCount, unseenConversations] = await Promise.all([
        Conversation.aggregate(pipeline),
        Conversation.aggregate([...pipeline.slice(0, -2), { $count: 'total' }]),
        Conversation.aggregate([
            ...pipeline.slice(0, -3),
            {
                $project: {
                    unseenMsg: { $ifNull: ['$unreadCountData.unreadCount', 0] },
                },
            },
            { $match: { unseenMsg: { $gt: 0 } } },
            { $count: 'totalUnseen' },
        ]),
    ]);

    const total = totalCount[0]?.total || 0;
    const totalUnseenConversations = unseenConversations[0]?.totalUnseen || 0;

    return {
        meta: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit),
            totalUnseenConversations,
        },
        data: results,
    };
};
const ConversationService = {
    getConversation,
};

export default ConversationService;
