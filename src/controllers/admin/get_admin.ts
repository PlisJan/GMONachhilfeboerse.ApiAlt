import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import Joi, { string } from "joi";
import { query } from "services/db";
import validationPatterns from "validation/commonPatterns";
import { generatePassword } from "services/passwordGenerator";

export default async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ message: "Great, you are an admin!" });
};
