import { Request, Response } from "express";
import Joi from "joi";

import { query } from "services/db";
import validationPatterns from "validation/commonPatterns";

/**
 * @swagger
 * /user/email:
 *    put:
 *      tags:
 *        - user
 *      summary: Update Email
 *      description: Change the email of the current user
 *      operationId: updateEmail
 *      requestBody:
 *        description: Provide new email to change the old one
 *        content:
 *          application/json:
 *            schema:
 *              properties:
 *                email:
 *                  type: string
 *                  format: email
 *                  example: max.mustermann@email.tld
 *        required: true
 *
 *      responses:
 *        "200":
 *          description: Successfully updated email
 *          content:
 *            application/json:
 *              schema:
 *                properties:
 *                  message:
 *                    type: string
 *                    default: Succesfully updated
 *                  details:
 *                    type: object
 *                    properties:
 *                      username:
 *                        type: string
 *                        pattern: "^[a-zA-Z0-9]+$"
 *                        example: "mustmax00"
 *                        minLength: 5
 *                        maxLength: 32
 *                      email:
 *                        type: string
 *                        format: email
 *                        example: max.mustermann@email.tld
 *        "400":
 *          $ref: "#/components/responses/InvalidInput"
 *        "401":
 *          $ref: "#/components/responses/Unauthorized"
 *        "500":
 *          $ref: "#/components/responses/InternalServerError"
 *      security:
 *        - userLoggedIn: []
 *
 */

export default async (req: Request, res: Response) => {
    // Create validation schema
    const schema = Joi.object({
        email: Joi.string().email().required(), // email, required
        user: validationPatterns.user, // required user (for pattern see validation/commonPatterns)
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
