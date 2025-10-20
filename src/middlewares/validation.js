const Joi = require("joi");

const validateInstitutionSchema = Joi.object({
  firstName: Joi.string().min(2).max(30).required(),
  lastName: Joi.string().min(2).max(30).required(),
  emailId: Joi.string().email().required(),
  phone: Joi.string().required(),
  password: Joi.string().min(6).max(128).required(),
  InstitutionName: Joi.string().min(2).max(100).required(),
  Role: Joi.string().valid("Dean", "HOD").required(),
});

module.exports =  validateInstitutionSchema 