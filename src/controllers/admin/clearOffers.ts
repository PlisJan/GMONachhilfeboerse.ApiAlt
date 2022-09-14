import { Request, Response } from "express";
import Joi from "joi";

import { query } from "services/db";
import validationPatterns from "validation/commonPatterns";

/**
 * @swagger
 *
 * /admin/clearOffers:
 *   delete:
 *     tags:
 *       - admin
 *     summary: Deletes <strong>ALL</strong> GiveOffers, TakeOffers and Matchings
 *     description: | 
 *                  Deletes ALL GiveOffers, TakeOffers and Matchings <br> 
 *                  <h3>USE IT CAREFULLY</h3> <br> 
 *                  Note: The data will be written into the Tables GiveLessonsOld, TakeLessonsOld, MatchesOld
 *     operationId: delAllOffers

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
 *                   default: Succesfully cleared
 *
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 *
 *     security:
 *       - adminLoggedIn: []
 *
 */

export default async (req: Request, res: Response) => {
    // Add the offer to the database
    const dbResult = await query(
        `
        DROP TABLE IF EXISTS MatchesOld
        DROP TABLE IF EXISTS GiveLessonsOld
        DROP TABLE IF EXISTS TakeLessonsOld
        CREATE TABLE MatchesOld SELECT * FROM Matches;
        CREATE TABLE GiveLessonsOld SELECT * FROM GiveLessons;
        CREATE TABLE TakeLessonsOld SELECT * FROM TakeLessons;
        TRUNCATE Matches;
        TRUNCATE GiveLessons;
        TRUNCATE TakeLessons;
        `,
        [],
        true
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
            message: "Succesfully cleared",
        });
        return;
    }
    // if it was not succesfully added
    // Return 500
    res.status(500).json({
        error: "Could not delete",
    });
};
