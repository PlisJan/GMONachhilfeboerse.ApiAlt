import { Request, Response } from "express";

import { query } from "services/db";

export default async (req: Request, res: Response) => {
    const userdata = req.body.user;
    const user = await query("SELECT * FROM Users WHERE username=?", [
        "plisjan03",
    ]);

    if (user) {
        res.status(200).json({
            message: "Found",
            user,
            userdata,
        });
    } else {
        res.status(400).json({
            message: "Bad request",
        });
    }
};
