import { Request, Response } from "express";
import Joi from "joi";

import { query } from "@/services/db";
import validationPatterns from "@/validation/commonPatterns";

/**
 * @swagger
 * /offers/take:
 *    post:
 *      tags:
 *        - offers
 *      summary: Add a take offer
 *      description: Add a new take offer
 *      operationId: addTakeOffer
 *      requestBody:
 *        description: Data needed for creating an offer
 *        content:
 *          application/json:
 *            schema:
 *              $ref: "#/components/schemas/TakeOffer"
 *        required: true
 *
 *      responses:
 *        "200":
 *          description: Successfully created the offer
 *          content:
 *            application/json:
 *              schema:
 *                properties:
 *                  message:
 *                    type: string
 *                    default: Succesfully inserted
 *                  details:
 *                    $ref: "#/components/schemas/TakeOffer"
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
        subject: Joi.string().required(), // Subject, required
        times: validationPatterns.times.required(), // times, required (for pattern see validation/commonPatterns)
        allowPhone: Joi.boolean().required(), // is passing the phonenumber to the opponent allowed?, required
        allowEmail: Joi.boolean().required(), // is passing the email adress to the opponent allowed?, required
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
        INSERT INTO TakeLessons 
            (user_id, subject, times, allowEmail, allowTel)
        VALUES
         ((SELECT user_id FROM Users WHERE username = ?), ?, ?, ?, ?)
        `,
        [
            validationResult.value.user.username,
            validationResult.value.subject,
            JSON.stringify(validationResult.value.times), // Has to be stringified
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
