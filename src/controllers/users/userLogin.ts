import bcrypt from "bcrypt";
import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";
import { query } from "services/db";
import validationPatterns from "validation/commonPatterns";

/**
 * @swagger
 *
 * /user/login:
 *   post:
 *     tags:
 *       - user
 *     summary: Get a token to login
 *     description: Get a JWT token used to authenticate to the API
 *     operationId: login
 *     requestBody:
 *       description: Provide username and password to login
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
 *               password:
 *                 type: string
 *                 format: password
 *                 pattern: ((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W]).*)
 *                 minLength: 8
 *                 maxLength: 256
 *                 example: "MySuperSavePassword4MyUseraccount!"
 *                 description: Needs to contain at least <br> - 1 lowercase character  <br> - 1 uppercase character <br> - 1 digit <br> - 1 special character
 *       required: true
 *     responses:
 *       "200":
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 message:
 *                   type: string
 *                   default: "Authentication successful."
 *                 userDetails:
 *                   type: object
 *                   $ref: "#/components/schemas/UserDetails"
 *                 token:
 *                   type: string
 *                   format: token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
 *
 *       "400":
 *         $ref: "#/components/responses/InvalidInput"
 *
 *       "401":
 *         description: Username or password incorrect
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 error:
 *                   type: string
 *                   default: Username or password incorrect.
 *
 *       "404":
 *         description: Username does not exist
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 error:
 *                   type: string
 *                   default: Username does not exists!
 *
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 *
 */

export default async (req: Request, res: Response, next: NextFunction) => {
    // Create validation schema
    const schema = Joi.object({
        username: validationPatterns.username.required(), // required username (for pattern see validation/commonPatterns)
        password: validationPatterns.password.required(), // required password (for pattern see validation/commonPatterns)
    });

    // Validate the request body
    const validationResult = schema.validate(req.body);

    // If the request body is invalid
    if (validationResult.error) {
        // return 400 with the generated error messages
        res.status(400).json({ error: validationResult.error.message });
        return;
    }

    // Query to check if the user already exists in the database
    const result = await query(
        "SELECT password,name,email,phonenumber,admin FROM Users WHERE username=?",
        validationResult.value.username
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
        res.status(404).json({ error: "Username does not exists!" });
        return;
    }

    // Get the first row from the fetched data
    const fetchedRow = (rows as RowDataPacket[])[0];

    // Compare the password given from the api with the password from the database
    const passwordCorrect = bcrypt.compareSync(
        validationResult.value.username + validationResult.value.password,
        fetchedRow.password
    );

    // If password is not correct
    if (!passwordCorrect) {
        // return 401
        res.status(401).json({ error: "Username or password incorrect." });
        return;
    }

    // Generate dictionary of the userData
    const userData = {
        username: validationResult.value.username,
        email: fetchedRow.email,
        name: fetchedRow.name,
        phonenumber: fetchedRow.phonenumber,
        admin: fetchedRow.admin == 1,
    };

    // Create a json web token with the userData, that expires in 2 hours
    const token = jwt.sign(userData, process.env.JWT_SECRET!, {
        expiresIn: "2h",
    });
    // Return 200 with the token and the userdata
    return res.status(200).json({
        message: "Authentication successful.",
        userDetails: userData,
        token: token,
    });
};
