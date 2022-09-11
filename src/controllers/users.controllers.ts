import getMe from "./users/get_user";
import userLogin from "./users/userLogin";
import addPersonalData from "./users/addPersonalData";
import updateEmail from "./users/update_email";
import updateName from "./users/update_name";
import updatePhonenumber from "./users/update_phone";
import changePassword from "./users/changePassword";

export default {
    getMe,
    userLogin,
    changePassword,
    addPersonalData,
    updateEmail,
    updateName,
    updatePhonenumber,
};
