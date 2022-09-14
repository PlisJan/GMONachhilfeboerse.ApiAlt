import { Request, Response } from "express";
import Joi from "joi";

import { query } from "services/db";
import validationPatterns from "validation/commonPatterns";

/**
 * @swagger
 * /user/addPersonalData:
 *    post:
 *      tags:
 *        - user
 *      summary: Add Name, Email and Phonenumber
 *      description: Add/ Change Name, Email and Phonenumber from the currentt user
 *      operationId: addPersonalData
 *      requestBody:
 *        description: Provide Name, Email and Phonenumber
 *        content:
 *          application/json:
 *            schema:
 *              properties:
 *                name:
 *                  type: string
 *                  pattern: "\\s[^ ]"
 *                  example: Max Mustermann
 *                email:
 *                  type: string
 *                  format: email
 *                  example: max.mustermann@email.tld
 *                phonenumber:
 *                  type: string
 *                  example: +49 0000 0000000
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
 *                    default: Succesfully added
 *                  details:
 *                    type: object
 *                    properties:
 *                      username:
 *                        type: string
 *                        pattern: "^[a-zA-Z0-9]+$"
 *                        example: "mustmax00"
 *                        minLength: 5
 *                        maxLength: 32
 *                      name:
 *                        type: string
 *                        pattern: "\\s[^ ]"
 *                        example: Max Mustermann
 *                      email:
 *                        type: string
 *                        format: email
 *                        example: max.mustermann@email.tld
 *                      phonenumber:
 *                        type: string
 *                        example: +49 0000 0000000
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
        // Name of the person (must have at least two words), required
        name: Joi.string()
            .pattern(/[^ ]+ [^ ].*/)
            .required(),
        email: Joi.string().email().required(), // email, required
        phonenumber: Joi.string().alphanum().optional(), // phonenumber, optional
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
        SET name=?,
            email=?,
            phonenumber=?
        WHERE username = ?
    `,
        [
            validationResult.value.name,
            validationResult.value.email,
            validationResult.value.phonenumber,
            validationResult.value.user.username,
        ]
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
            message: "Succesfully added",
            details: {
                username: validationResult.value.user.username,
                name: validationResult.value.name,
                email: validationResult.value.email,
                phonenumber: validationResult.value.phonenumber,
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
            name: validationResult.value.name,
            email: validationResult.value.email,
            phonenumber: validationResult.value.phonenumber,
        },
    });
};
