import { Request, Response } from "express";
import Joi from "joi";
import validationPatterns from "validation/commonPatterns";
import { query } from "services/db";

/**
 * @swagger
 *
 * /admin/changeAdminState:
 *   post:
 *     tags:
 *       - admin
 *     summary: Change admin state
 *     description: Make a user an admin or remove ones permissions
 *     operationId: changeAdminState
 *     requestBody:
 *       description: Provide the username and the new admin state of the user
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               username:
 *                 type: string
 *                 pattern: "^[a-zA-Z0-9]+$"
 *                 example: "mustmax00"
 *                 minLength: 5
 *                 maxLength: 32
 *               adminState:
 *                 type: boolean
 *                 example: true
 *       required: true
 *
 *     responses:
 *       "200":
 *         description: Successfully updated adminstate
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 message:
 *                   type: string
 *                   default: Succesfully updated
 *                 details:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       pattern: "^[a-zA-Z0-9]+$"
 *                       example: "mustmax00"
 *                       minLength: 5
 *                       maxLength: 32
 *                     adminState:
 *                       type: boolean
 *                       example: true
 *
 *       "400":
 *         $ref: "#/components/responses/InvalidInput"
 *
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 *
 *     security:
 *       - adminLoggedIn: []
 *
 */

export default async (req: Request, res: Response) => {
    // Create validation schema
    const schema = Joi.object({
        username: validationPatterns.username.required(), // required username (for pattern see validation/commonPatterns)
        adminState: Joi.boolean().required(), // required boolean
        user: Joi.any(), // user given from the authentication method
    });

    // Validate the request body
    const validationResult = schema.validate(req.body);

    // If the request body is invalid
    if (validationResult.error) {
        // return 400 with the generated error message
        res.status(400).json({ error: validationResult.error.message });
        return;
    }

    // Add the user to the database
    const dbResult = await query(`UPDATE Users SET admin=? WHERE username=?`, [
        validationResult.value.adminState,
        validationResult.value.username,
    ]);

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
                username: validationResult.value.username,
                adminState: validationResult.value.adminState,
            },
        });
        return;
    }
    // if it was not succesfully added
    // Return 500
    res.status(500).json({
        error: "Could not update the users admin state",
        details: {
            username: validationResult.value.username,
            adminState: validationResult.value.adminState,
        },
    });
};
