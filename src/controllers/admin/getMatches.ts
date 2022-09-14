import { Request, Response } from "express";
import { RowDataPacket } from "mysql2/promise";

import { query } from "services/db";

/**
 *
 * @swagger
 *
 * /admin/match:
 *   get:
 *     tags:
 *       - admin
 *     summary: Get the matchings
 *     description: Get all the matched and unmatched take offers
 *     operationId: getMatches
 *     responses:
 *       "200":
 *         description: Successfully got matchings
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 matches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       P1Username:
 *                         type: string
 *                         pattern: "^[a-zA-Z0-9]+$"
 *                         example: "mustmia00"
 *                         minLength: 5
 *                         maxLength: 32
 *                       P1Name:
 *                         type: string
 *                         pattern: "\\s[^ ]"
 *                         example: Mia Mustermann
 *                       P1Class:
 *                         type: string
 *                         minLength: 1
 *                         maxLength: 10
 *                         example: "5a"
 *                       Subject:
 *                         type: string
 *                         example: DE
 *                       Time:
 *                         type: string
 *                         example: Mi07
 *                       P2Username:
 *                         type: string
 *                         pattern: "^[a-zA-Z0-9]+$"
 *                         example: "mustmax00"
 *                         minLength: 5
 *                         maxLength: 32
 *                       P2Name:
 *                         type: string
 *                         pattern: "\\s[^ ]"
 *                         example: Max Mustermann
 *                       P2Class:
 *                         type: string
 *                         minLength: 1
 *                         maxLength: 10
 *                         example: "5a"
 *
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
 *
 */

export default async (req: Request, res: Response) => {
    const result = await query(
        `
        SELECT U.username          as P1Username,
            U.name              as P1Name,
            C.name              as P1Class,
            TakeLessons.subject as Subject,
            M.time              as Time,
            U2.username         as P2Username,
            U2.name             as P2Name,
            C2.name             as P2Class
        FROM TakeLessons
                INNER JOIN Users U on TakeLessons.user_id = U.user_id
                INNER JOIN Classes C on U.class_id = C.id
                LEFT JOIN Matches M on TakeLessons.id = M.takeLessons_id
                LEFT JOIN GiveLessons GL on GL.id = M.giveLessons_id
                LEFT JOIN Users U2 on U2.user_id = GL.user_id
                LEFT JOIN Classes C2 on U2.class_id = C2.id
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

    res.status(200).json({
        matches: rows,
    });
};
