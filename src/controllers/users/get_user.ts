import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";

import { query } from "services/db";

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
