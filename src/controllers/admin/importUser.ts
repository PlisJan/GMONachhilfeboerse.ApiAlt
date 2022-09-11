import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import Joi, { string } from "joi";
import { query } from "services/db";
import validationPatterns from "validation/commonPatterns";
import { generatePassword } from "services/passwordGenerator";

export default async (req: Request, res: Response, next: NextFunction) => {
    // ################################### Validate input ###################################

    // Create validation schema
    const schema = Joi.array().items(
        Joi.object({
            username: validationPatterns.username.required(), // required username (for pattern see validation/commonPatterns)
            class_name: Joi.string().alphanum().max(10).min(1).required(), // Integer, is required,
        })
    );

    // Validate the request body
    const validationResult = schema.validate(req.body);

    // If the request body is invalid
    if (validationResult.error) {
        // return 400 with the generated error message
        res.status(400).json({ error: validationResult.error.message });
        return;
    }
    // ################################### Initialize insert loop ###################################

    const alreadyExistingUsers = [];
    const insertedUsers = [];
    const databaseErrors = [];
    const unknownErrors = [];

    // for each user to insert
    for (const user of validationResult.value as {
        username: string;
        class_name: string;
    }[]) {
        // ################################### Check if user already exists ###################################

        // Query to check if the user already exists in the database
        const usersQuery = await query(
            "SELECT username FROM Users WHERE username=?",
            user.username
        );

        // If there is a database error
        if (usersQuery.error != undefined) {
            // Append the error message and the user to th database errors list
            databaseErrors.push({
                error: usersQuery.error.message,
                user: user,
            });
            // Continue with next user
            continue;
        }

        const userRows = usersQuery.result;

        // If the user does already exists
        if (userRows && (userRows as any[]).length > 0) {
            // append it to alreadyExisting users and skip
            alreadyExistingUsers.push(user);
            continue;
        }

        // ################################### Create Class if needed ###################################

        // Create class if not exists (need to use user.class_name twice because i used two question marks)
        const classCreateResult = await query(
            `INSERT INTO Classes(name)
            SELECT * FROM (SELECT ? as name) AS new_value
            WHERE NOT EXISTS (
             SELECT name FROM Classes WHERE name = ?
            ) LIMIT 1;`,
            [user.class_name, user.class_name]
        );

        // If there is a database error
        if (classCreateResult.error != undefined) {
            // Append the error message and the user to th database errors list
            databaseErrors.push({
                error: classCreateResult.error.message,
                user: user,
            });
            // Continue with next user
            continue;
        }

        // ################################### Generate Password ###################################

        // Generate a random password for the user
        const newPassword = generatePassword(16);

        // Hash the password in combination with the username using crypt
        const hashedPassword = bcrypt.hashSync(user.username + newPassword, 10);

        // ################################### Create user ###################################

        // Add the user to the database
        const dbResult = await query(
            `INSERT INTO Users(username,class_id,password,startPassword)
            SELECT ?, id, ?, ?
            FROM Classes
            WHERE Classes.name=?;`,
            [user.username, hashedPassword, newPassword, user.class_name]
        );

        // If there is a database error
        if (dbResult.error != undefined) {
            // Append the error message and the user to th database errors list
            databaseErrors.push({
                error: dbResult.error.message,
                user: user,
            });
            // Continue with next user
            continue;
        }

        const result = dbResult.result;

        // If the User was successfully added
        if (!Array.isArray(result) && result.affectedRows > 0) {
            // Append user to the inserted users
            insertedUsers.push(user);
        } else {
            unknownErrors.push(user);
        }
    }
    // ################################### Return results ###################################

    // If any user was imported
    if (insertedUsers.length > 0) {
        // Return 201
        res.status(201).json({
            inserted: insertedUsers,
            alreadyExistingUsers: alreadyExistingUsers,
            databaseErrors: databaseErrors,
            unknownErrors: unknownErrors,
        });
    }
    // if NO user was imported
    else {
        // Return 500
        res.status(500).json({
            inserted: insertedUsers,
            alreadyExistingUsers: alreadyExistingUsers,
            databaseErrors: databaseErrors,
            unknownErrors: unknownErrors,
        });
    }
};
