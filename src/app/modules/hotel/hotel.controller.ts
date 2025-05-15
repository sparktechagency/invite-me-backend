import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import HotelService from './hotel.service';

const createHotel = catchAsync(async (req, res) => {
    const result = await HotelService.createHotel(req.body);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Hotel created successfully',
        data: result,
    });
});

const getAllHotels = catchAsync(async (req, res) => {
    const result = await HotelService.getAllHotels(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Hotels retrieved successfully',
        data: result,
    });
});

const getSingleHotel = catchAsync(async (req, res) => {
    const result = await HotelService.getSingleHotel(req.params.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Hotel retrieved successfully',
        data: result,
    });
});

const deleteHotel = catchAsync(async (req, res) => {
    const result = await HotelService.deleteHotel(req.params.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Hotel deleted successfully',
        data: result,
    });
});

const updateHotel = catchAsync(async (req, res) => {
    const result = await HotelService.updateHotel(req.params.id, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Hotel updated successfully',
        data: result,
    });
});

const HotelController = {
    createHotel,
    getAllHotels,
    getSingleHotel,
    deleteHotel,
    updateHotel,
};

export default HotelController;
