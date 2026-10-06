import Joi from "joi";

// Any syntactically valid address; Joi's built-in TLD list would reject .org, .edu, .io, ...
const emailField = () => Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
        "string.email": "please enter a valid email address",
        "any.required": "please enter your email"
    });


//---------------------------------signUpValidator----------------------------------

export const signUpValidator = {
    body: Joi.object().required().keys({

        username: Joi.string().required().messages({
            "string.base": "your name must be string",
            "any.required": "please enter your name"
        }),
        email: emailField(),
        password: Joi.string()
            .required()
            .min(6)
            .max(30)
            .pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/)
            .messages({
                "string.min": "password must contain at least 6 characters",
                "string.max": "password must contain 30 characters as maximum",
                "string.pattern.base": "password must contain at least 1 uppercase letter, 1 number, and a symbol"
            }),
        cpass: Joi.string().required().valid(Joi.ref("password")).messages({
            "any.only": "confirmation password must match password .. Try again"
        }),
    })
};

//---------------------------------teacherSignUpValidator----------------------------------

export const teacherSignUpValidator = {
    body: Joi.object().required().keys({
        name: Joi.string().trim().min(2).required().messages({
            "string.min": "name must contain at least 2 characters",
            "any.required": "please enter your name"
        }),
        email: emailField(),
        password: Joi.string()
            .required()
            .min(6)
            .max(30)
            .messages({
                "string.min": "password must contain at least 6 characters",
                "string.max": "password must contain 30 characters as maximum",
            }),
        // Sent by the client form; optional so API callers may omit it
        confirmPassword: Joi.string().valid(Joi.ref("password")).messages({
            "any.only": "confirmation password must match password .. Try again"
        }),
        phone: Joi.string().trim().required().messages({
            "any.required": "please enter your phone number"
        }),
        address: Joi.string().trim().required().messages({
            "any.required": "please enter your address"
        }),
        nationalId: Joi.string().pattern(/^\d{14}$/).required().messages({
            "string.pattern.base": "national ID must be exactly 14 digits",
            "any.required": "please enter your national ID"
        }),
    })
};

//---------------------loginValidator-------------------–––--––--–––––––––––––––––––
export const loginValidator = {
    body: Joi.object()
        .required()
        .keys({
            email: emailField(),
            // Kept at 5 so accounts created under the old 5-character minimum can still sign in
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

//---------------------emailOnlyValidator (resetPassword, resendConfirmation)------------------
export const emailOnlyValidator = {
    body: Joi.object().required().keys({
        email: emailField(),
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
            .min(6)
            .max(30)
            .pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/)
            .messages({
                "string.min": "Password must contain at least 6 characters",
                "string.max": "Password must contain 30 characters as maximum",
                "string.pattern.base": "Password must contain at least 1 uppercase letter, 1 number, and a symbol"
            }),
        confirmNewPassword: Joi.string().required().valid(Joi.ref("newPassword")).messages({
            "any.only": "Must Match New password "
        }),
    })
};
