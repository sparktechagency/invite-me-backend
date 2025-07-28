import { model, Schema } from 'mongoose';

const BlockSchema = new Schema(
    {
        blocker: {
            type: Schema.Types.ObjectId,
            ref: 'NormalUser',
            required: true,
        },
        blocked: {
            type: Schema.Types.ObjectId,
            ref: 'NormalUser',
            required: true,
        },
    },
    { timestamps: true }
);

export const Block = model('Block', BlockSchema);
