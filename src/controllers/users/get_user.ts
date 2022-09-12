import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";

import { query } from "services/db";

/**
 *
 * @swagger
 *
 * /user:
 *   get:
 *     tags:
 *       - user
 *     summary: Get the own user data
 *     description: Get the username, name, email and phonenumber of the logged in user
 *     operationId: get_user
 *     responses:
 *       "200":
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 username:
 *                   type: string
 *                   example: mustermax00
 *                 name:
 *                   type: string
 *                   example: Max Mustermann
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: max.mustermann@email.tld
 *                 phonenumber:
 *                   type: string
 *                   example: +49 0000 0000000
 *
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *
 *       "404":
 *         description: No user data found
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No data exists!
 *
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 *
 *     security:
 *       - userLoggedIn: []
 *
 */

export default async (req: Request, res: Response) => {
    const result = await query("SELECT * FROM Users WHERE username=?", [
        req.body.user.username,
    ]);
    // If there is a database error
    if (result.error != undefined) {
        // Return 500
        res.status(500).json({ error: result.error.message });
        return;
    }

    const rows = result.result as RowDataPacket[];

    // If the user does not exists
    if (!rows || rows.length == 0) {
        // return 400 Conflict
        res.status(404).json({ error: "No data exists!" });
        return;
    }

    res.status(200).json({
        username: rows[0].username,
        name: rows[0].name,
        email: rows[0].email,
        phonenumber: rows[0].phonenumber,
    });
};
