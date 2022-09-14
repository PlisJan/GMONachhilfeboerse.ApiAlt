import { Request, Response } from "express";
import { RowDataPacket } from "mysql2/promise";

import { query } from "@/services/db";

/**
 * @swagger
 *
 * /offers/take:
 *   get:
 *     tags:
 *       - offers
 *     summary: Get the TakeOffers
 *     description: Get all take offers from the loggged in user with the name, email, and phonenumber of the matched opponent
 *     operationId: getTakeOffer
 *
 *     responses:
 *       "200":
 *         description: Succesfully got offer
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 offers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         minimum: 0
 *                         example: 542
 *                       matched:
 *                         type: boolean
 *                         example: true
 *                       subject:
 *                         type: string
 *                         maxLength: 5
 *                         example: "DE"
 *                       times:
 *                         $ref: "#/components/schemas/Times"
 *                       name:
 *                         type: string
 *                         pattern: "\\s[^ ]"
 *                         example: Max Mustermann
 *                       email:
 *                         type: string
 *                         format: email
 *                         example: max.mustermann@email.tld
 *                       phonenumber:
 *                         type: string
 *                         example: +49 0000 0000000
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
    // Request the data from the database
    const result = await query(
        `
        SELECT TakeLessons.id,
            TakeLessons.subject,
            TakeLessons.times,
            GiveLessons.allowEmail,
            GiveLessons.allowTel , 
            u2.name,
            u2.email, 
            u2.phonenumber
        FROM
            Users AS u1
                INNER JOIN
            TakeLessons ON u1.user_id = TakeLessons.user_id
                LEFT JOIN
            Matches ON TakeLessons.id = Matches.takeLessons_id
                LEFT JOIN
            GiveLessons ON Matches.giveLessons_id = GiveLessons.id
                LEFT JOIN
            Users AS u2 ON GiveLessons.user_id = u2.user_id
        WHERE
            u1.username = ?
        ORDER BY TakeLessons.id ASC
    `,
        [req.body.user.username]
    );

    // If there is a database error
    if (result.error != undefined) {
        // Return 500
        res.status(500).json({ error: result.error.message });
        return;
    }

    // Get result as RowDataPacket[]
    const rows = result.result as RowDataPacket[];

    // If the user does not exists
    if (!rows || (rows as any).length == 0) {
        // return 400 Conflict
        res.status(200).json({ offers: [] });
        return;
    }

    // Initialize array
    const takeOffers: any[] = [];

    // For each row
    for (const row of rows) {
        try {
            // Process each offer
            takeOffers.push({
                id: row.id, // Just use the queued id => no processing
                matched:
                    ((row.name as boolean) && row.name.length > 0) || false, // Is matched, if there is a name of the opponent given
                subject: row.subject, // Just use the queued subject => no processing
                times: JSON.parse(row.times), // Parse the times field (which is stored as json string in the database)
                name: row.name, // Just use the queued name of the oppenent => no processing
                email: row.allowEmail ? row.email || null : null, // Only provide the opponents email if the opponent agreed and has an email specified, else return null
                phonenumber: row.allowTel ? row.tel || null : null, // Only provide the opponents tel if the opponent agreed and has an tel specified, else return null
            });
        } catch (error) {
            // Internal server error occured
            res.status(500).json({ error });
        }
    }

    // Return the offers
    res.status(200).json({
        offers: takeOffers,
    });
};
