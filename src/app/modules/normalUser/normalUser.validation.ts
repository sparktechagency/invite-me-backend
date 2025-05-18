import { z } from 'zod';
import { ENUM_GENDER } from '../user/user.enum';

const registerNormalUserValidationSchema = z.object({
    body: z.object({
        name: z.string({
            required_error: 'Name is required',
            invalid_type_error: 'Name must be a string',
        }),

        bio: z.string({
            required_error: 'Bio is required',
            invalid_type_error: 'Bio must be a string',
        }),

        email: z
            .string({
                required_error: 'Email is required',
                invalid_type_error: 'Email must be a string',
            })
            .email('Invalid email format'),

        phone: z.string({
            required_error: 'Phone is required',
            invalid_type_error: 'Phone must be a string',
        }),

        gender: z.enum(Object.values(ENUM_GENDER) as [string, ...string[]]),

        dateOfBirth: z.preprocess(
            (arg) => {
                if (typeof arg === 'string' || arg instanceof Date)
                    return new Date(arg);
            },
            z.date({
                invalid_type_error: 'Invalid date format for dateOfBirth',
            })
        ),

        address: z.string({
            required_error: 'Address is required',
            invalid_type_error: 'Address must be a string',
        }),

        interests: z
            .array(
                z.string({
                    invalid_type_error: 'Each interest must be a string',
                }),
                {
                    required_error: 'Interests are required',
                    invalid_type_error: 'Interests must be an array of strings',
                }
            )
            .min(1, { message: 'At least one interest is required' }),

        language: z
            .array(
                z.string({
                    invalid_type_error: 'Each language must be a string',
                }),
                {
                    required_error: 'Language is required',
                    invalid_type_error: 'Language must be an array of strings',
                }
            )
            .min(1, { message: 'At least one language is required' }),

        checkInDate: z.preprocess(
            (arg) => {
                if (typeof arg === 'string' || arg instanceof Date)
                    return new Date(arg);
            },
            z.date({
                invalid_type_error: 'Invalid date format for checkInDate',
            })
        ),

        checkOutDate: z.preprocess(
            (arg) => {
                if (typeof arg === 'string' || arg instanceof Date)
                    return new Date(arg);
            },
            z.date({
                invalid_type_error: 'Invalid date format for checkOutDate',
            })
        ),
    }),
});

const updateNormalUserValidationSchema = z.object({
    body: z.object({
        name: z
            .string({
                invalid_type_error: 'Name must be a string',
            })
            .optional(),

        bio: z
            .string({
                invalid_type_error: 'Bio must be a string',
            })
            .optional(),

        email: z
            .string({
                invalid_type_error: 'Email must be a string',
            })
            .email('Invalid email format')
            .optional(),

        phone: z
            .string({
                invalid_type_error: 'Phone must be a string',
            })
            .optional(),

        profile_image: z
            .string({
                invalid_type_error: 'Profile image must be a string',
            })
            .optional(),

        gender: z
            .enum(Object.values(ENUM_GENDER) as [string, ...string[]], {
                invalid_type_error: 'Gender must be one of the allowed values',
            })
            .optional(),

        dateOfBirth: z
            .preprocess(
                (arg) => {
                    if (typeof arg === 'string' || arg instanceof Date)
                        return new Date(arg);
                },
                z.date({
                    invalid_type_error: 'Invalid date format for dateOfBirth',
                })
            )
            .optional(),

        address: z
            .string({
                invalid_type_error: 'Address must be a string',
            })
            .optional(),

        interests: z
            .array(
                z.string({
                    invalid_type_error: 'Each interest must be a string',
                }),
                {
                    invalid_type_error: 'Interests must be an array of strings',
                }
            )
            .min(1, { message: 'At least one interest is required' })
            .optional(),

        images: z
            .array(
                z.string({ invalid_type_error: 'Each image must be a string' }),
                {
                    invalid_type_error: 'Images must be an array of strings',
                }
            )
            .min(1, { message: 'At least one image is required' })
            .optional(),

        language: z
            .array(
                z.string({
                    invalid_type_error: 'Each language must be a string',
                }),
                {
                    invalid_type_error: 'Language must be an array of strings',
                }
            )
            .min(1, { message: 'At least one language is required' })
            .optional(),

        checkInDate: z
            .preprocess(
                (arg) => {
                    if (typeof arg === 'string' || arg instanceof Date)
                        return new Date(arg);
                },
                z.date({
                    invalid_type_error: 'Invalid date format for checkInDate',
                })
            )
            .optional(),

        checkOutDate: z
            .preprocess(
                (arg) => {
                    if (typeof arg === 'string' || arg instanceof Date)
                        return new Date(arg);
                },
                z.date({
                    invalid_type_error: 'Invalid date format for checkOutDate',
                })
            )
            .optional(),
    }),
});

const normalUserValidations = {
    registerNormalUserValidationSchema,
    updateNormalUserValidationSchema,
};

export default normalUserValidations;
