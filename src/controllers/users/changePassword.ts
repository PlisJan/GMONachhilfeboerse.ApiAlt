import { Request, Response } from "express";
import Joi from "joi";
import { RowDataPacket } from "mysql2/promise";
import bcrypt from "bcrypt";

import { query } from "@/services/db";
import validationPatterns from "@/validation/commonPatterns";

/**
 * @swagger
 *
 * /user/changePassword:
 *   post:
 *     tags:
 *       - user
 *     summary: Change password
 *     description: Change the password of the current user
 *     operationId: changePassword
 *     requestBody:
 *       description: Provide old and new password to change the password
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 pattern: ((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W]).*)
 *                 minLength: 8
 *                 maxLength: 256
 *                 example: "MySuperSavePassword4MyUseraccount!"
 *                 description: Needs to contain at least <br> - 1 lowercase character  <br> - 1 uppercase character <br> - 1 digit <br> - 1 special character
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 pattern: ((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W]).*)
 *                 minLength: 8
 *                 maxLength: 256
 *                 example: "MySuperSavePassword4MyUseraccount!"
 *                 description: |
 *                   Needs to contain at least <br>
 *                   - 1 lowercase character  <br>
 *                   - 1 uppercase character <br>
 *                   - 1 digit <br>
 *                   - 1 special character <br><br>
 *                    Must be different from oldPassword
 *       required: true
 *
 *     responses:
 *       "200":
 *         description: Successfully changed password
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 message:
 *                   type: string
 *                   default: Succesfully changed password
 *                 details:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: "#/components/schemas/UserDetails"
 *
 *       "400":
 *         $ref: "#/components/responses/InvalidInput"
 *
 *       "401":
 *         description: Password incorrect
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 error:
 *                   type: string
 *                   default: Old password incorrect.
 *
 *       "404":
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 error:
 *                   type: string
 *                   default: Username does not exists!
 *
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 *
 *     security:
 *       - userLoggedIn: []
 *
 */

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
        res.status(404).json({ error: "Username does not exists!" });
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
                user: validationResult.value.user,
            },
        });
        return;
    }
    // if it was not changed
    // Return 500
    res.status(500).json({
        error: "Could not change password",
        details: {
            user: validationResult.value.user,
        },
    });
};
