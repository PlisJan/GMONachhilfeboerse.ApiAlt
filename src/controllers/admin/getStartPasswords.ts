import { Request, Response } from "express";
import { RowDataPacket } from "mysql2/promise";

import { query } from "services/db";

/**
 *
 * @swagger
 *
 * /admin/getStartPasswords:
 *   get:
 *     tags:
 *       - admin
 *     summary: Get the start passwords
 *     description: Get the start password from all users
 *     operationId: getStartPasswords
 *     responses:
 *       "200":
 *         description: Successfully got passwords
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 startPasswords:
 *                   type: object
 *                   example:
 *                     5a:
 *                       Benedikt: "ajsod,-opaskdoaskd"
 *                       Klaus: "sdjfoincvnyxj.,-vpsadjospo"
 *                     5b:
 *                       Annette: "asdmaopsmopcpsdoüasdmx"
 *                       Luisa: "sdmiopxcvpnniwein9q238"
 *
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
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
 *       - adminLoggedIn: []
 *
 */

export default async (req: Request, res: Response) => {
    const result = await query(
        `
    SELECT C.name as classname ,Users.username, Users.startPassword
    FROM Users
        INNER JOIN Classes C on Users.class_id = C.id
    `,
        []
    );

    // If there is a database error
    if (result.error != undefined) {
        // Return 500
        res.status(500).json({ error: result.error.message });
        return;
    }

    const rows = result.result;

    // If the user does not exists
    if (!rows || (rows as any).length == 0) {
        // return 400 Conflict
        res.status(404).json({ error: "No data exists!" });
        return;
    }

    const startPasswords: {
        [className: string]: { [username: string]: string };
    } = {};

    for (const row of rows as RowDataPacket[]) {
        if (!startPasswords[row.classname]) {
            startPasswords[row.classname] = {};
        }

        startPasswords[row.classname][row.username] = row.startPassword;
    }

    res.status(200).json({
        startPasswords,
    });
};
