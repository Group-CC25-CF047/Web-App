import Joi from "joi";

export const UserRegistrationSchema = Joi.object({
    first_name: Joi.string()
        .min(1)
        .max(50)
        .required()
        .pattern(/^[a-zA-Z\s\-']+$/) // Allow letters, spaces, hyphens, and apostrophes
        .messages({
            "string.base": `"first_name" should be a type of 'text'`,
            "string.empty": `"first_name" cannot be an empty field`,
            "string.min": `"first_name" should have a minimum length of {#limit}`,
            "string.max": `"first_name" should have a maximum length of {#limit}`,
            "any.required": `"first_name" is a required field`,
            "string.pattern.base": `"first_name" must contain only letters, spaces, hyphens, and apostrophes`
        }),
    last_name: Joi.string()
        .allow("", null)
        .max(50)
        .pattern(/^[a-zA-Z\s\-']*$/) // Allow letters, spaces, hyphens, and apostrophes
        .messages({
            "string.base": `"last_name" should be a type of 'text'`,
            "string.max": `"last_name" should have a maximum length of {#limit}`,
            "string.pattern.base": `"last_name" must contain only letters, spaces, hyphens, and apostrophes`
        }),
    password: Joi.string()
        .min(8)
        .max(128)
        .required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .messages({
            "string.base": `"password" should be a type of 'text'`,
            "string.empty": `"password" cannot be an empty field`,
            "string.min": `"password" should have a minimum length of {#limit}`,
            "string.max": `"password" should have a maximum length of {#limit}`,
            "any.required": `"password" is a required field`,
            "string.pattern.base": `"password" must contain at least one lowercase letter, one uppercase letter, one number, and one special character`
        }),
    confirm_password: Joi.string().required().valid(Joi.ref("password")).messages({
        "any.only": "Passwords do not match",
        "any.required": `"confirm_password" is a required field`
    }),
    email: Joi.string().email().max(100).required().messages({
        "string.base": `"email" should be a type of 'text'`,
        "string.empty": `"email" cannot be an empty field`,
        "string.email": `"email" must be a valid email`,
        "string.max": `"email" should have a maximum length of {#limit}`,
        "any.required": `"email" is a required field`
    }),
    photo: Joi.string().allow("", null).messages({
        "string.base": `"photo" should be a type of 'text'`
    }),
    otp_code: Joi.number().required().min(100000).max(999999).messages({
        "number.base": `"otp_code" should be a type of 'number'`,
        "number.empty": `"otp_code" cannot be an empty field`,
        "number.min": `"otp_code" must be exactly 6 digits`,
        "number.max": `"otp_code" must be exactly 6 digits`,
        "any.required": `"otp_code" is a required field`
    })
});

export const UserLoginSchema = Joi.object({
    email: Joi.string()
        .email()
        .max(100)
        .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
        .required()
        .messages({
            "string.base": `"email" should be a type of 'text'`,
            "string.empty": `"email" cannot be an empty field`,
            "string.email": `"email" must be a valid email`,
            "string.max": `"email" should have a maximum length of {#limit}`,
            "string.pattern.base": `"email" must be a valid email format`,
            "any.required": `"email" is a required field`
        }),
    password: Joi.string()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required()
        .messages({
            "string.base": `"password" should be a type of 'text'`,
            "string.empty": `"password" cannot be an empty field`,
            "string.min": `"password" should have a minimum length of {#limit}`,
            "string.max": `"password" should have a maximum length of {#limit}`,
            "string.pattern.base": `"password" must contain at least one lowercase letter, one uppercase letter, one number, and one special character`,
            "any.required": `"password" is a required field`
        })
});

export const UserPasswordValidationSchema = Joi.object({
    email: Joi.string()
        .email()
        .max(100)
        .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
        .required()
        .messages({
            "string.base": `"email" should be a type of 'text'`,
            "string.empty": `"email" cannot be an empty field`,
            "string.email": `"email" must be a valid email`,
            "string.max": `"email" should have a maximum length of {#limit}`,
            "string.pattern.base": `"email" must be a valid email format`,
            "any.required": `"email" is a required field`
        }),
    password: Joi.string()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required()
        .messages({
            "string.base": `"password" should be a type of 'text'`,
            "string.empty": `"password" cannot be an empty field`,
            "string.min": `"password" should have a minimum length of {#limit}`,
            "string.max": `"password" should have a maximum length of {#limit}`,
            "string.pattern.base": `"password" must contain at least one lowercase letter, one uppercase letter, one number, and one special character`,
            "any.required": `"password" is a required field`
        }),
    confirm_password: Joi.string().required().valid(Joi.ref("password")).messages({
        "any.only": "Passwords do not match",
        "any.required": `"confirm_password" is a required field`
    }),
    otp_code: Joi.number().required().min(100000).max(999999).messages({
        "number.base": `"otp_code" should be a type of 'number'`,
        "number.empty": `"otp_code" cannot be an empty field`,
        "number.min": `"otp_code" must be exactly 6 digits`,
        "number.max": `"otp_code" must be exactly 6 digits`,
        "any.required": `"otp_code" is a required field`
    })
});

export const UserUpdateSchema = Joi.object({
    first_name: Joi.string()
        .min(1)
        .max(50)
        .optional()
        .pattern(/^[a-zA-Z\s\-']+$/) // Allow letters, spaces, hyphens, and apostrophes
        .messages({
            "string.base": `"first_name" should be a type of 'text'`,
            "string.empty": `"first_name" cannot be an empty field`,
            "string.min": `"first_name" should have a minimum length of {#limit}`,
            "string.max": `"first_name" should have a maximum length of {#limit}`,
            "any.required": `"first_name" is a required field`,
            "string.pattern.base": `"first_name" must contain only letters, spaces, hyphens, and apostrophes`
        }),
    last_name: Joi.string()
        .allow("", null)
        .max(50)
        .pattern(/^[a-zA-Z\s\-']*$/) // Allow letters, spaces, hyphens, and apostrophes
        .messages({
            "string.base": `"last_name" should be a type of 'text'`,
            "string.max": `"last_name" should have a maximum length of {#limit}`,
            "string.pattern.base": `"last_name" must contain only letters, spaces, hyphens, and apostrophes`
        }),
    password: Joi.string()
        .min(8)
        .max(128)
        .required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .messages({
            "string.base": `"password" should be a type of 'text'`,
            "string.empty": `"password" cannot be an empty field`,
            "string.min": `"password" should have a minimum length of {#limit}`,
            "string.max": `"password" should have a maximum length of {#limit}`,
            "any.required": `"password" is a required field`,
            "string.pattern.base": `"password" must contain at least one lowercase letter, one uppercase letter, one number, and one special character`
        }),
    email: Joi.string().email().max(100).optional().messages({
        "string.base": `"email" should be a type of 'text'`,
        "string.empty": `"email" cannot be an empty field`,
        "string.email": `"email" must be a valid email`,
        "string.max": `"email" should have a maximum length of {#limit}`,
        "any.required": `"email" is a required field`
    })
});
