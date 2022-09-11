import Joi from "joi";

const username = Joi.string().alphanum().min(5).max(32); // Aphanumeric string with min 5 and max 32 characters

const password = Joi.string()
    .min(8) // Minimum 8 characters
    .max(256) // Maximum 256 characters
    // Has to contain at least
    // 1 number               (?=.*\d)
    // 1 lowercase letter     (?=.*[a-z])
    // 1 UPPERCASE letter     (?=.*[A-Z])
    // 1 special character    (?=.*[\W])
    .pattern(/((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W]).*)/);

const times = Joi.object({
    Mo: Joi.string().allow("").required(),
    Di: Joi.string().allow("").required(),
    Mi: Joi.string().allow("").required(),
    Do: Joi.string().allow("").required(),
    Fr: Joi.string().allow("").required(),
});

const user = Joi.object({
    username: username.required(),
}).unknown(true);

export default { username, password, user, times };
