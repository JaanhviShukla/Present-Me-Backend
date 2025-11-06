const { PutCommand,UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { findByEmail, findById } = require("./awsService");
const {v4:uuidv4}= require('uuid');
const bcrypt = require("bcrypt");
const{docClient}= require('../dynamoDb');


const SALT_ROUNDS=10;
const TABLE_NAME="students";
const CLASS_TABLE="classes";


async function createStudent({firstName,lastName,emailId,phone,institutionId,password,rollNo}){
  //lowercase email to ensure uniqueness
  const normalizedEmail=emailId.toLowerCase();
  //1) check duplicate
  const  existing =await findByEmail(normalizedEmail , "students");
  if(existing){
    const err = new Error("Email already exists");
    err.code="DUPLICATE_EMAIL";
    throw err;
  }

  //hash password
  const passwordHash = await bcrypt.hash(password,SALT_ROUNDS);

  //Get institution info (for name reference)
  const institution = await findById(institutionId, "Institutions", "institutionId");
  
  if (!institution) {
    throw new Error("Invalid institutionId — no such institution found.");
  }

  //3) build item
  const item={
    studentId:"s-"+uuidv4(),
    firstName,
    lastName,
    emailId:normalizedEmail,
    phone,
    passwordHash,
    rollNo,  
    institutionId,            
    type: "student",
    createdAt: new Date().toISOString()
  };

  //4)put item
  const putCmd = new PutCommand({
    TableName:TABLE_NAME,
    Item:item,
    ConditionExpression:"attribute_not_exists(studentId)" //to avoid overwriting existing item
  });
  await docClient.send(putCmd);
  //5)return item(without passwordHash)
  const {passwordHash:_,...itemWithoutPasswordHash}=item;
  return itemWithoutPasswordHash;
}


async function addJoinRequest(classCode,studentId){
  const updateCmd= new UpdateCommand({
    TableName:CLASS_TABLE,
    Key:{ classCode },
    UpdateExpression: "SET joinRequests = list_append(if_not_exists(joinRequests, :empty_list), :studentId)",
    ExpressionAttributeValues:{
      ":studentId":[studentId],
      ":empty_list":[],
    },
    ReturnValues:"UPDATED_NEW",
  });
  try{
    await docClient.send(updateCmd);
  }catch(err){
    throw new Error("Failed to add join request: " + err.message);  
  }
  }

module.exports={createStudent,addJoinRequest};