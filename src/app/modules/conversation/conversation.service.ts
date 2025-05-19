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

const getConversation = async (
  profileId: string,
  query: Record<string, unknown>,
) => {
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

  // search condition------------
  const searchConditions = [];
  if (searchTerm) {
    searchConditions.push({
      $or: ['user.name', 'user.email', 'project.title', 'project.name'].map(
        (field) => ({ [field]: { $regex: searchTerm, $options: 'i' } }),
      ),
    });
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
        from: 'projects',
        localField: 'projectId',
        foreignField: '_id',
        as: 'project',
      },
    },
    {
      $unwind: {
        path: '$project',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'users',
        let: { participants: '$participants' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $in: ['$_id', '$$participants'],
                  },
                  {
                    $ne: ['$_id', new Types.ObjectId(profileId)],
                  },
                ],
              },
            },
          },
          {
            $limit: 1,
          },
        ],
        as: 'otherUser',
      },
    },
    {
      $unwind: '$otherUser',
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
                  { $eq: ['$conversationId', '$$conversationId'] },
                  { $eq: ['$seen', false] },
                  { $ne: ['$msgByUserId', new Types.ObjectId(profileId)] },
                ],
              },
            },
          },
          {
            $count: 'unreadCount',
          },
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
        project: {
          _id: 1,
          title: 1,
          name: 1,
          projectImage: 1,
        },
        lastMessage: 1,
        created_at: '$createdAt',
        updated_at: '$updatedAt',
        unseenMsg: { $ifNull: ['$unreadCountData.unreadCount', 0] },
      },
    },

    ...(searchConditions.length > 0
      ? [{ $match: { $and: [searchConditions] } }]
      : []),
    {
      // $sort: { 'lastMessage.createdAt': -1 },
      $sort: { updated_at: -1 },
    },
    { $skip: skip },
    { $limit: limit },
  ];

  const [results, totalCount] = await Promise.all([
    Conversation.aggregate(pipeline),
    Conversation.aggregate([...pipeline.slice(0, -2), { $count: 'total' }]),
  ]);
  const total = totalCount[0]?.total || 0;
  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: results,
  };
};

const ConversationService = {
  getConversation,
};

export default ConversationService;
