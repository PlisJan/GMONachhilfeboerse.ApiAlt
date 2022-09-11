import { Request, Response } from "express";
import Joi from "joi";

import { query } from "services/db";
import validationPatterns from "validation/commonPatterns";

export default async (req: Request, res: Response) => {
    // Create validation schema
    const schema = Joi.object({
        email: Joi.string().email().required(), // email, required
        user: Joi.object({
            username: validationPatterns.username.required(),
        }).unknown(true), // required username (for pattern see validation/commonPatterns)
    });

    // Validate the request body
    const validationResult = schema.validate(req.body);

    // If the request body is invalid
    if (validationResult.error) {
        // return 400 with the generated error messages
        res.status(400).json({ error: validationResult.error.message });
        return;
    }

    // Add the user to the database
    const dbResult = await query(
        `UPDATE Users
        SET email=?,
        WHERE username = ?
    `,
        [validationResult.value.email, validationResult.value.user.username]
    );

    // If there is a database error
    if (dbResult.error != undefined) {
        // Return 500
        res.status(500).json({ error: dbResult.error.message });
        return;
    }

    const result = dbResult.result;

    // If the User was successfully added
    if (!Array.isArray(result) && result.affectedRows > 0) {
        // Return 200
        res.status(200).json({
            message: "Succesfully updated",
            details: {
                username: validationResult.value.user.username,
                email: validationResult.value.email,
            },
        });
        return;
    }
    // if it was not succesfully added
    // Return 500
    res.status(500).json({
        error: "Could not update",
        details: {
            username: validationResult.value.user.username,
            email: validationResult.value.email,
        },
    });
};
