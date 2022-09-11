import { Request, Response } from "express";
import Joi from "joi";

import { query } from "services/db";
import validationPatterns from "validation/commonPatterns";

export default async (req: Request, res: Response) => {
    // Create validation schema
    const schema = Joi.object({
        subject: Joi.string().required(), // Subject, required
        times: validationPatterns.times.required(), // times, required (for pattern see validation/commonPatterns)
        allowPhone: Joi.boolean().required(), // is passing the phonenumber to the opponent allowed?, required
        allowEmail: Joi.boolean().required(), // is passing the email adress to the opponent allowed?, required
        minClass: Joi.number().integer().min(1).max(13).required(), // the minimum class level to be matched with, required
        // the maximum class level to be matched with (must be greater or equal to the min class level), required
        maxClass: Joi.number()
            .integer()
            .min(1)
            .max(13)
            .greater(Joi.ref("minClass", { adjust: (v) => v - 1 })) // Greater or equal
            .required(),
        user: validationPatterns.user.required(), // required user (for pattern see validation/commonPatterns),
    });
    // Validate the request body
    const validationResult = schema.validate(req.body);

    // If the request body is invalid
    if (validationResult.error) {
        // return 400 with the generated error messages
        res.status(400).json({ error: validationResult.error.message });
        return;
    }

    // Add the offer to the database
    const dbResult = await query(
        `
        INSERT INTO GiveLessons 
            (user_id, subject, times, min_class, max_class, allowEmail, allowTel)
        VALUES
         ((SELECT user_id FROM Users WHERE username = ?), ?, ?, ?, ?, ?, ?)
        `,
        [
            validationResult.value.user.username,
            validationResult.value.subject,
            JSON.stringify(validationResult.value.times), // Has to be stringified
            validationResult.value.minClass,
            validationResult.value.maxClass,
            validationResult.value.allowEmail,
            validationResult.value.allowPhone,
        ]
    );

    // If there is a database error
    if (dbResult.error != undefined) {
        // Return 500
        res.status(500).json({ error: dbResult.error.message });
        return;
    }

    const result = dbResult.result;

    // Get details for return but without user data
    const details = JSON.parse(JSON.stringify(validationResult.value));
    details["user"] = undefined;

    // If the User was successfully added
    if (!Array.isArray(result) && result.affectedRows > 0) {
        // Return 200
        res.status(200).json({
            message: "Succesfully inserted",
            details: {
                username: validationResult.value.user.username,
                details,
            },
        });
        return;
    }
    // if it was not succesfully added
    // Return 500
    res.status(500).json({
        error: "Could not insert",
        details: {
            username: validationResult.value.user.username,
            details,
        },
    });
};
