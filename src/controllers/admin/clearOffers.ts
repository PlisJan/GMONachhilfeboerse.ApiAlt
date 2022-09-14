import { Request, Response } from "express";
import Joi from "joi";

import { query } from "services/db";
import validationPatterns from "validation/commonPatterns";

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
