import { Schema, model } from 'mongoose';
import { IHotel } from './hotel.interface';

const HotelSchema = new Schema<IHotel>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        location: {
            type: String,
            required: true,
        },
        wifiIp: {
            type: String,
            required: true,
        },
        hotel_image: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

const Hotel = model<IHotel>('Hotel', HotelSchema);
export default Hotel;
