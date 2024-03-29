import { Request, Response } from "express";
import { RowDataPacket } from "mysql2/promise";

import { query } from "@/services/db";

/**
 *
 * @swagger
 *
 * /subjects:
 *   get:
 *     tags:
 *       - subjects
 *     summary: Get all subjects
 *     description: Get all subjects
 *     operationId: get_subjects
 *     responses:
 *       "200":
 *         description: Successfully got subjects
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 subjects:
 *                   type: object
 *                   example:
 *                     DE: Deutsch
 *                     EN: Englisch
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
 *
 */

export default async (req: Request, res: Response) => {
    const result = await query(
        `
    SELECT *
    FROM Subjects
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

    const subjects: any = {};

    for (const row of rows as RowDataPacket[]) {
        // Use the abbreviation as key and assign the name
        subjects[row.abbreviation] = row.name;
    }

    // Return 200
    res.status(200).json({
        subjects,
    });
};
