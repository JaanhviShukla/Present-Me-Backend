const Joi = require("joi");
const teacherSignupSchema= Joi.object({
  firstName: Joi.string().min(2).max(30).required(),
  lastName: Joi.string().min(2).max(30).required(),
  emailId: Joi.string().email().required(),
  phone:Joi.string().pattern(/^[0-9]{10}$/).required(),
  password: Joi.string().min(6).max(128).required(),
  institutionId: Joi.string().required(),
  collegeName: Joi.string().min(2).max(100).required(),



});
const teacherLoginSchema= Joi.object({
  emailId: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
});
module.exports={teacherSignupSchema,teacherLoginSchema};