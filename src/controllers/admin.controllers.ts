// import bcrypt from "bcrypt";
// require("../Node.Js-sample-project-structure/node_modules/dotenv").config();
// import jwt from "jsonwebtoken";
// import Admin from "../Models/admin";

import changeAdminState from "./admin/changeAdminState";
import importUser from "./admin/importUser";
import getStartPasswords from "./admin/getStartPasswords";

export default { changeAdminState, importUser, getStartPasswords };
