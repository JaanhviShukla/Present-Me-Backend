//created for dynamodb operations related to teachers
const {PutCommand,QuerCommand}= require("@aws-sdk/lib-dynamodb");
const {docClient}= require('../dynamoDb');
const {findByEmail,findById}= require("./awsService");
const {v4:uuidv4}= require('uuid');
const bcrypt = require("bcrypt");


const TABLE_NAME="teachers";
const EMAIL_INDEX="EmailIndex";

async function createTeacher(data){

  const normalizedEmail=data.emailId.toLowerCase();
  //1) check duplicate
  const existing = await findByEmail(normalizedEmail, "teachers");
  if(existing){
    const err = new Error("Email already exists");
    err.code="DUPLICATE_EMAIL";
    throw err;
  }

  const hashedPassword = await bcrypt.hash(data.password,10);

  const institution = await findById(data.institutionId, "Institutions", "institutionId");
  if (!institution) {
    throw new Error("Invalid institutionId — no such institution found.");
  }

  const item={
    teacherId:"t-"+uuidv4(),
    firstName: data.firstName,  
    lastName: data.lastName,
    emailId: normalizedEmail,
    phone: data.phone,
    passwordHash: hashedPassword,
    institutionId: data.institutionId,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  const cmd= new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
    ConditionExpression: "attribute_not_exists(emailId)" //prevent overwrite if email exists
  });
  await docClient.send(cmd);
  return item;
}
module.exports={createTeacher};
