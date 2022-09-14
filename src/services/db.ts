import mysql from "mysql2/promise";
import dotenv from "dotenv";

type result = {
    result:
        | mysql.RowDataPacket[]
        | mysql.RowDataPacket[][]
        | mysql.OkPacket
        | mysql.OkPacket[]
        | mysql.ResultSetHeader;
    error: undefined;
};
type error = { result: undefined; error: { message: any } };

dotenv.config();

const dbConfig: mysql.ConnectionOptions = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
};

export async function query(
    sql: string,
    params?: any,
    enableMultipleStatements?: boolean
): Promise<result | error> {
    if (!Array.isArray(params)) {
        params = [params];
    }
    let connection: mysql.Connection;
    if (enableMultipleStatements) {
        const enabledDBConfig: mysql.ConnectionOptions = JSON.parse(
            JSON.stringify(dbConfig)
        );
        enabledDBConfig.multipleStatements = true;
        connection = await mysql.createConnection(enabledDBConfig);
    } else {
        connection = await mysql.createConnection(dbConfig);
    }

    try {
        const [results] = await connection.query(sql, params);
        connection.end();
        return { result: results, error: undefined };
    } catch (error) {
        connection.end();
        return { error: { message: error }, result: undefined };
    }
}
