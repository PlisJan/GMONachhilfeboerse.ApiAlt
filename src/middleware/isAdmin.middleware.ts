import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { RowDataPacket } from "mysql2/promise";
import { query } from "@/services/db";

export default async function (
    req: Request,
    res: Response,
    next: NextFunction
) {
    // Query to check if the user is admin
    const result = await query(
        "SELECT admin FROM Users WHERE username=?",
        req.body.user.username
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
        res.status(401).json({ error: "Username does not exists!" });
        return;
    }

    // Get the first row from the fetched data
    const fetchedRow = (rows as RowDataPacket[])[0];

    if (!fetchedRow.admin) {
        console.log(
            "[" +
                new Date().toUTCString() +
                "] " +
                "unauthorized administrator login attempt by user '" +
                req.body.user.username +
                "'"
        );
        res.status(403).json({
            error: "Forbidden! You are not an admin, so you do not have access to this resource!",
        });
        return;
    }
    console.log(
        "[" +
            new Date().toUTCString() +
            "] " +
            "Succesful administrator login attempt by user '" +
            req.body.user.username +
            "'"
    );
    // continue with the actual endpoint
    next();
}
