import { Request, Response } from "express";
import Joi from "joi";
import { RowDataPacket } from "mysql2/promise";
import bcrypt from "bcrypt";

import { query } from "services/db";
import validationPatterns from "validation/commonPatterns";

export default async (req: Request, res: Response) => {
    // ################################### Validate input ###################################

    // Create validation schema
    const schema = Joi.object({
        oldPassword: validationPatterns.password.required(), // oldPassword, required
        newPassword: validationPatterns.password
            .required()
            .invalid(Joi.ref("oldPassword")), // newPassword (unequal to old password), required
        user: validationPatterns.user, // required user (for pattern see validation/commonPatterns)
    });

    // Validate the request body
    const validationResult = schema.validate(req.body);

    // If the request body is invalid
    if (validationResult.error) {
        // if oldPassword is equal to new password
        if ((validationResult.error.details[0].type = "any.invalid")) {
            res.status(400).json({
                error: "new password must be different from the old password!",
            });
            return;
        }

        // return 400 with the generated error messages
        res.status(400).json({ error: validationResult.error.message });
        return;
    }

    // ################################### Check old password ###################################

    // Query to check if the user already exists in the database
    const passwordQueryResult = await query(
        "SELECT password,name,email,phonenumber FROM Users WHERE username=?",
        validationResult.value.user.username
    );

    // If there is a database error
    if (passwordQueryResult.error != undefined) {
        // Return 500
        res.status(500).json({ error: passwordQueryResult.error.message });
        return;
    }

    const rows = passwordQueryResult.result;

    // If the user does not exists
    if (!rows || (rows as any).length == 0) {
        // return 400 Conflict
        res.status(401).json({ error: "Username does not exists!" });
        return;
    }

    // Get the first row from the fetched data
    const fetchedRow = (rows as RowDataPacket[])[0];

    // Compare the password given from the api with the password from the database
    const passwordCorrect = bcrypt.compareSync(
        validationResult.value.user.username +
            validationResult.value.oldPassword,
        fetchedRow.password
    );

    // If password is not correct
    if (!passwordCorrect) {
        // return 401
        res.status(401).json({ error: "Old password incorrect." });
        return;
    }

    // Old password is correct
    // ################################### Update password ###################################

    // Hash password and username with bcrypt
    const hashedPassword = bcrypt.hashSync(
        validationResult.value.user.username +
            validationResult.value.newPassword,
        10
    );

    // Add the user to the database
    const dbResult = await query(
        `UPDATE Users
        SET password=?
        WHERE username = ?
    `,
        [hashedPassword, validationResult.value.user.username]
    );

    // If there is a database error
    if (dbResult.error != undefined) {
        // Return 500
        res.status(500).json({ error: dbResult.error.message });
        return;
    }

    const result = dbResult.result;

    // If the password was successfully changed
    if (!Array.isArray(result) && result.affectedRows > 0) {
        // Return 200
        res.status(200).json({
            message: "Succesfully changed password",
            details: {
                username: validationResult.value.user.username,
                email: validationResult.value.email,
            },
        });
        return;
    }
    // if it was not changed
    // Return 500
    res.status(500).json({
        error: "Could not change password",
        details: {
            username: validationResult.value.user.username,
            email: validationResult.value.email,
        },
    });
};
