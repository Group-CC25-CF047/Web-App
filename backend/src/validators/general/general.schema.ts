import Joi from "joi";

export const ApiKeySchema = Joi.string()
    .pattern(/^[a-f0-9]{64}$/)
    .required()
    .messages({
        "string.base": `"apiKey" should be a type of 'text'`,
        "string.empty": `"apiKey" cannot be an empty field`,
        "string.pattern.base": `"apiKey" must be a valid SHA-256 hash`,
        "any.required": `"apiKey" is a required field`
    });

export const CookieSchema = Joi.string()
    .pattern(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
    .required()
    .messages({
        "string.base": `"cookie" should be a type of 'text'`,
        "string.empty": `"cookie" cannot be an empty field`,
        "string.pattern.base": `"cookie" must be a valid JWT token in format "header.payload.signature"`,
        "any.required": `"cookie" is a required field`
    });

export const IdSchema = Joi.object({
    id: Joi.string().uuid().required().messages({
        "string.base": `"id" should be a type of 'text'`,
        "string.empty": `"id" cannot be an empty field`,
        "string.guid": `"id" must be a valid UUID`,
        "any.required": `"id" is a required field`
    })
});
