import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import MetaService from './meta.service';

const getDashboardMetaData = catchAsync(async (req, res) => {
    const result = await MetaService.getDashboardMetaData();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Dashboard meta data retrieved successfully',
        data: result,
    });
});

const getUserChartData = catchAsync(async (req, res) => {
    const result = await MetaService.getUserChartData(Number(req?.query.year));
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User chart data retrieved successfully',
        data: result,
    });
});
const getEarningsByType = catchAsync(async (req, res) => {
    const result = await MetaService.getEarningsByType(Number(req?.query.year));
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Earning chart data retrieved successfully',
        data: result,
    });
});

const MetaController = {
    getDashboardMetaData,
    getUserChartData,
    getEarningsByType,
};

export default MetaController;
