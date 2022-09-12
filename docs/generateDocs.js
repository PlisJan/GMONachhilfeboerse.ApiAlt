// import swaggerJsdoc from "swagger-jsdoc";

const swaggerJsdoc = require("swagger-jsdoc");
const fs = require("fs");
const path = require('path');
const baseConfig=require("./BaseConfig.json")

const options = {
    failOnErrors: true, // Whether or not to throw when parsing errors. Defaults to false.
    definition: baseConfig,
    apis: [
        path.resolve(__dirname,"../src/controllers/users/userLogin.ts"), // Show /login at the first position
        path.resolve(__dirname,"../src/**/*.ts"),
    ],
};

const openapiSpecification = swaggerJsdoc(options);
console.log(openapiSpecification)

fs.writeFileSync(path.resolve(__dirname,"./openapi.json"), JSON.stringify(openapiSpecification));
