export function generatePassword(length?: number): string {
    // list of characters to pick from
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-.,_:;#'+*$%&/()[]{}";
    // Initialuze password as empty
    let passwd = "";

    // Loop [length] or (if no length is given) 16 times
    for (let i = 0; i < (length || 16); i++) {
        // Generate a random number between 0 and the length of the characters string
        var charPos = Math.floor(Math.random() * characters.length + 1);
        // append the character from the random generated position to the password
        passwd += characters.charAt(charPos);
    }
    return passwd;
}
