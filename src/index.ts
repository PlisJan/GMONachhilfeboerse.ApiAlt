import express, { NextFunction, Request, Response } from "express";
import logger from "morgan";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import usersRouter from "routes/users.routes";
import adminRouter from "routes/admin.routes";
import offersRouter from "routes/offers.routes";

dotenv.config();

const app = express();

app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/users", usersRouter);
app.use("/admin", adminRouter);
app.use("/offers", offersRouter);

// catch 404 and forward to error handler
app.use(function (req: Request, res: Response, next: NextFunction) {
    res.status(404).json({
        message: "No such route exists",
    });
});

// error handler
app.use(function (err: any, req: Request, res: Response, next: NextFunction) {
    res.status(err.status || 500).json({
        message: "Can't process your input!",
    });
});

app.listen(process.env.PORT, () => {
    console.log(
        `⚡️[server]: Server is running at http://localhost:${process.env.PORT}`
    );
});
