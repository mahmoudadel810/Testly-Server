// token
import jwt from "jsonwebtoken";

export const tokenFunction = ({
    payload = {} || "",
    signature = process.env.SIGNATURE || "fallback_secret_key_for_development",
    expiresIn = 60 * 60,
    generate = true
}) =>
{
    // Debug log
    // console.log("JWT Signature available:", !!signature);

    if (!signature)
    {
        console.error("ERROR: JWT signature is missing or undefined!");
        return false;
    }

    // book: check for empty object
    if (typeof payload == "object")
    {
        if (Object.keys(payload).length)
        {
            if (generate && typeof payload == "object")
            {
                const token = jwt.sign(payload, signature, { expiresIn });
                return token;
            }
        }
        return false;
    }

    // to decode the token
    if (typeof payload == "string")
    {
        if (payload == "")
        {
            return false;
        }
        if (generate == false && typeof payload == "string")
        {
            const decode = jwt.verify(payload, signature);
            return decode;
        }
    }
};
