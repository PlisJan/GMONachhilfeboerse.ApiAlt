import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export default function (req: Request, res: Response, next: NextFunction) {
    // Get the bearer authorization header
    const bearerHeader = req.header("authorization");

    // If there is no authorization header
    if (!bearerHeader)
        // Return 401 Unauthorized
        return res.status(401).send({
            error: {
                message: "Access Denied!",
                details: "No token entered. Please add a Bearer token.",
            },
        });

    // Split the header (usually its "Bearer myGreatAndWonderfulToken")
    const tokenData = bearerHeader.split(" ");
    // If the autorization is not in the common format
    if (tokenData.length < 2) {
        // Return 401 Unauthorized
        return res.status(401).send({
            error: {
                message: "Access Denied!",
                details: "Wrong token format! Please use a bearer token.",
            },
        });
    }

    try {
        // Try to verify if the provided token is correct
        const verified = jwt.verify(tokenData[1], process.env.JWT_SECRET!);
        // add the data from the token to the request body
        req.body.user = verified;
        // continue with the actual endpoint
        next();
    } catch (err) {
        // Verifying the token was not succesful => return 401 Unauthorized
        res.status(401).send({
            error: "Invalid token. Please log in to get a new one!",
        });
    }
}
