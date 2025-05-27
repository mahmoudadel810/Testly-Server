import Joi from "joi";


//---------------------------------signUpValidator----------------------------------

export const signUpValidator = {
    body: Joi.object().required().keys({

        username: Joi.string().required().messages({
            "string.base": "your name must be string",
            "any.required": "please enter your name"
        }),
        email: Joi.string()
            .email({
                maxDomainSegments: 2, // allowd dots in my email .. ex dola.com.net
                tlds: { allow: ["com", "net"] }
            })
            .required()
            .messages({
                "string.email": "please enter a valid format"
            }),
        password: Joi.string()
            .required()
            .min(5)
            .max(30)
            .pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/)
            .messages({
                "string.min": "password must contain at least 5 characters",
                "string.max": "password must contain 30 characters as maximum",
                "string.pattern.base": "password must contain at least 1 uppercase letter, 1 number, and a symbol"
            }),
        cpass: Joi.string().required().valid(Joi.ref("password")).messages({
            "any.only": "confirmation password must match password .. Try again"
        }),
    })
};
//---------------------loginValidator-------------------–––--––--–––––––––––––––––––
export const loginValidator = {
    body: Joi.object()
        .required()
        .keys({
            email: Joi.string()
                .email({
                    maxDomainSegments: 3,
                    tlds: { allow: ["com", "net"] }
                })
                .required()
                .messages({
                    "string.email": "please enter a valid format eg .. [ .Com , .net ]"
                }),
            password: Joi.string()
                .required()
                .min(5)
                .max(30)
                .messages({
                    "string.min": "password must contain at least 5 characters",
                    "string.max": "password must contain 30 characters as maximum",
                }),
        })
};

//======================================resetPassword-==========================

export const verifyReset = {
    body: Joi.object().keys({
        code: Joi.string().required().messages({
            "object.unknown": "Code Sent to your Gmail Does Not Match"
        }),
        newPassword: Joi.string()
            .required()
            .min(5)
            .max(30)
            .pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/)
            .messages({
                "string.min": "Password must contain at least 5 characters",
                "string.max": "Password must contain 30 characters as maximum",
                "string.pattern.base": "Password must contain at least 1 uppercase letter, 1 number, and a symbol"
            }),
        confirmNewPassword: Joi.string().required().valid(Joi.ref("newPassword")).messages({
            "any.only": "Must Match New password "
        }),
    })
};