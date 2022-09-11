import { Request, Response } from "express";
import { RowDataPacket } from "mysql2/promise";

import { query } from "services/db";

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
