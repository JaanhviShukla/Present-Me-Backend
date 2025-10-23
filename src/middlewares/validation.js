const Joi = require("joi");

const validateInstitutionSchema = Joi.object({
  firstName: Joi.string().min(2).max(30).required(),
  lastName: Joi.string().min(2).max(30).required(),
  emailId: Joi.string().email().required(),
  phone: Joi.string().required(),
  password: Joi.string().min(6).max(128).required(),
  InstitutionName: Joi.string().min(2).max(100).required(),
  Role: Joi.string().valid("Dean", "HOD", "Class Incharge").required(),
});

const validateStudentSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required().messages({
    "string.empty": "First name is required",
    "string.min": "First name must be at least 2 characters long",
  }),

  lastName: Joi.string().trim().min(2).max(50).required().messages({
    "string.empty": "Last name is required",
  }),

  emailId: Joi.string().email().required().messages({
    "string.email": "Email must be valid",
    "string.empty": "Email is required",
  }),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must be 10 digits",
      "string.empty": "Phone number is required",
    }),

  password: Joi.string()
    .min(6)
    .max(20)
    .required()
    .pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@$!%*?&]).+$/)
    .messages({
      "string.pattern.base":
        "Password must include uppercase, lowercase, number, and special character",
      "string.min": "Password must be at least 6 characters long",
      "string.empty": "Password is required",
    }),

  rollNo: Joi.string().trim().required().messages({
    "string.empty": "Roll number is required",
  }),

  institutionId: Joi.string().trim().required().messages({
    "string.empty": "Institution selection is required",
  }),
});

module.exports = { validateInstitutionSchema, validateStudentSchema };