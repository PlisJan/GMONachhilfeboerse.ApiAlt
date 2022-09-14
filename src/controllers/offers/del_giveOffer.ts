import { Request, Response } from "express";
import Joi from "joi";

import { query } from "@/services/db";
import validationPatterns from "@/validation/commonPatterns";

/**
 * @swagger
 *
 * /offers/give:
 *   delete:
 *     tags:
 *       - offers
 *     summary: Delete a give offer
 *     description: Delete a give offer by id
 *     operationId: delGiveOffer
 *     requestBody:
 *       description: Provide an id to delete the offer
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               id:
 *                 type: integer
 *                 minimum: 0
 *                 example: 542
 *       required: true
 *
 *     responses:
 *       "200":
 *         description: Succesfully deleted offer
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 message:
 *                   type: string
 *                   default: Succesfully deleted
 *                 details:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       pattern: "^[a-zA-Z0-9]+$"
 *                       example: "mustmax00"
 *                       minLength: 5
 *                       maxLength: 32
 *                     id:
 *                       type: integer
 *                       minimum: 0
 *                       example: 542
 *
 *       "400":
 *         $ref: "#/components/responses/InvalidInput"
 *
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 *
 *     security:
 *       - userLoggedIn: []
 *
 */

export default async (req: Request, res: Response) => {
    // Create validation schema
    const schema = Joi.object({
        id: Joi.number().integer().min(0).required(), // id, required
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
        DELETE FROM GiveLessons WHERE user_id=(SELECT user_id FROM Users WHERE username=?) AND id=?;
        `,
        [validationResult.value.user.username, validationResult.value.id]
    );

    // If there is a database error
    if (dbResult.error != undefined) {
        if (/ER_ROW_IS_REFERENCED.*/.test(dbResult.error.message.code)) {
            res.status(400).json({
                error: "Cannot delete offer, because it is already matched.",
            });
            return;
        }
        // Return 500
        res.status(500).json({ error: dbResult.error.message });
        return;
    }

    const result = dbResult.result;

    // If the User was successfully added
    if (!Array.isArray(result) && result.affectedRows > 0) {
        // Return 200
        res.status(200).json({
            message: "Succesfully deleted",
            details: {
                username: validationResult.value.user.username,
                offerID: validationResult.value.id,
            },
        });
        return;
    }
    // if it was not succesfully added
    // Return 500
    res.status(500).json({
        error: "Could not delete",
        details: {
            username: validationResult.value.user.username,
            offerID: validationResult.value.id,
        },
    });
};
