/// this will check duplicate email and create an institution

const {ScanCommand,PutCommand,QueryCommand}= require("@aws-sdk/lib-dynamodb");
const{docClient}= require('../dynamoDb');
const {v4:uuidv4}= require('uuid');
const bcrypt = require("bcrypt");

const SALT_ROUNDS=10;
const TABLE_NAME="Institutions";
const EMAIL_INDEX="EmailIndex";

async function findByEmail(emailId){
  //query the gsi to see if email already exists
  const cmd= new QueryCommand({
    TableName:TABLE_NAME,
    IndexName:EMAIL_INDEX,
    KeyConditionExpression:"emailId = :e",
    ExpressionAttributeValues:{":e":emailId.toLowerCase()},
    Limit:1
  });
  const res=await docClient.send(cmd);
  return (res.Items && res.Items.length>0)? res.Items[0]:null;
}

async function createInstitution({firstName,lastName,emailId,phone,InstitutionName,Role,password,documentUrl}){
  //lowercase email to ensure uniqueness
  const normalizedEmail=emailId.toLowerCase();
  //1) check duplicate
  const  existing =await findByEmail(normalizedEmail);
  if(existing){
    const err = new Error("Email already exists");
    err.code="DUPLICATE_EMAIL";
    throw err;
  }

  //hash password

  const passwordHash = await bcrypt.hash(password,SALT_ROUNDS);

  //3) build item
  const item={
    institutionId:"inst-"+uuidv4(),
    firstName,
    lastName,
    InstitutionName,
    Role,
    emailId:normalizedEmail,
    phone,
    passwordHash,
    documentUrl: documentUrl || null,
    createdAt: new Date().toISOString()
  };

  //4)put item
  const putCmd = new PutCommand({
    TableName:TABLE_NAME,
    Item:item,
    ConditionExpression:"attribute_not_exists(institutionId)" //to avoid overwriting existing item
  });
  await docClient.send(putCmd);
  //5)return item(without passwordHash)
  const {passwordHash:_,...itemWithoutPasswordHash}=item;
  return itemWithoutPasswordHash;
}
module.exports={createInstitution,findByEmail};