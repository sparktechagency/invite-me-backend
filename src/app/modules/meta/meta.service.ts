/* eslint-disable @typescript-eslint/no-explicit-any */
import { onlineUser } from '../../socket/socketManager';
import { ENUM_CONNECTION_STATUS } from '../connection/connection.enum';
import Connection from '../connection/connection.model';
import NormalUser from '../normalUser/normalUser.model';

const getDashboardMetaData = async (query: Record<string, unknown>) => {
    const hotelId = query?.hotelId as string | undefined;

    let totalUser: number;
    let totalConnection: number;
    let totalActiveUser: number;
    let totalActiveConnection: number;

    const onlineUserIds = Array.from(onlineUser);

    if (hotelId) {
        // 🔍 Get users of this hotel
        const hotelUsers = await NormalUser.find({ hotel: hotelId }).select(
            '_id '
        );
        const hotelUserIds = hotelUsers.map((u) => u._id);

        // 📊 Static counts
        totalUser = hotelUserIds.length;
        totalConnection = await Connection.countDocuments({
            status: ENUM_CONNECTION_STATUS.ACCEPTED,
            sender: { $in: hotelUserIds },
            receiver: { $in: hotelUserIds },
        });

        // ⚡ Real-time counts
        const activeProfileIds = onlineUserIds.filter((id: any) =>
            hotelUserIds.includes(id.toString())
        );

        totalActiveUser = activeProfileIds.length;

        totalActiveConnection = await Connection.countDocuments({
            status: ENUM_CONNECTION_STATUS.ACCEPTED,
            sender: { $in: activeProfileIds },
            receiver: { $in: activeProfileIds },
        });
    } else {
        totalUser = await NormalUser.countDocuments();
        totalConnection = await Connection.countDocuments({
            status: ENUM_CONNECTION_STATUS.ACCEPTED,
        });
        totalActiveUser = onlineUserIds.length;
        totalActiveConnection = await Connection.countDocuments({
            status: ENUM_CONNECTION_STATUS.ACCEPTED,
            sender: { $in: onlineUserIds },
            receiver: { $in: onlineUserIds },
        });
    }

    return {
        totalUser,
        totalConnection,
        totalActiveUser,
        totalActiveConnection,
    };
};

const getUserChartData = async (year: number) => {
    const currentYear = year || new Date().getFullYear();

    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear + 1, 0, 1);

    const chartData = await NormalUser.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startOfYear,
                    $lt: endOfYear,
                },
            },
        },
        {
            $group: {
                _id: { $month: '$createdAt' },
                totalUser: { $sum: 1 },
            },
        },
        {
            $project: {
                month: '$_id',
                totalUser: 1,
                _id: 0,
            },
        },
        {
            $sort: { month: 1 },
        },
    ]);

    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];

    const data = Array.from({ length: 12 }, (_, index) => ({
        month: months[index],
        totalUser:
            chartData.find((item) => item.month === index + 1)?.totalUser || 0,
    }));

    const yearsResult = await NormalUser.aggregate([
        {
            $group: {
                _id: { $year: '$createdAt' },
            },
        },
        {
            $project: {
                year: '$_id',
                _id: 0,
            },
        },
        {
            $sort: { year: 1 },
        },
    ]);

    const yearsDropdown = yearsResult.map((item: any) => item.year);

    return {
        chartData: data,
        yearsDropdown,
    };
};

const MetaService = {
    getDashboardMetaData,
    getUserChartData,
};

export default MetaService;
