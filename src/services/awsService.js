/// this will check duplicate email and create an institution

const {
  ScanCommand,
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { docClient } = require("../dynamoDb");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;
const TABLE_NAME = "Institutions";
const EMAIL_INDEX = "EmailIndex";

// Validation schema

async function findByEmail(emailId, tableName) {
  //query the gsi to see if email already exists
  const cmd = new QueryCommand({
    TableName: tableName,
    IndexName: EMAIL_INDEX,
    KeyConditionExpression: "emailId = :e",
    ExpressionAttributeValues: { ":e": emailId.toLowerCase() },
    Limit: 1,
  });
  const res = await docClient.send(cmd);
  return res.Items && res.Items.length > 0 ? res.Items[0] : null;
}

async function createInstitution({
  firstName,
  lastName,
  emailId,
  phone,
  InstitutionName,
  Role,
  password,
  aadharUrl,
  designationIDUrl,


}) {
  //lowercase email to ensure uniqueness
  const normalizedEmail = emailId.toLowerCase();
  //1) check duplicate
  const existing = await findByEmail(normalizedEmail, TABLE_NAME);
  if (existing) {
    const err = new Error("Email already exists");
    err.code = "DUPLICATE_EMAIL";
    throw err;
  }

  //hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  //3) build item
  const item = {
    institutionId: "inst-" + uuidv4(),
    firstName,
    lastName,
    InstitutionName,
    Role,
    emailId: normalizedEmail,
    phone,
    passwordHash,
    aadharUrl: aadharUrl || null,
    designationIDUrl: designationIDUrl || null,
    status: "pending",
    type: "institute",
    createdAt: new Date().toISOString(),
  };

  //4)put item
  const putCmd = new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
    ConditionExpression: "attribute_not_exists(institutionId)", //to avoid overwriting existing item
  });
  await docClient.send(putCmd);
  //5)return item(without passwordHash)
  const { passwordHash: _, ...itemWithoutPasswordHash } = item;
  return itemWithoutPasswordHash;
}

async function findById(id, tableName = TABLE_NAME, keyName) {
  const cmd = new GetCommand({
    TableName: tableName,
    Key: { [keyName]: id },
  });
  const res = await docClient.send(cmd);
  return res.Item || null;
}

// Get all institutions
async function getAllInstitutions() {
  const cmd = new ScanCommand({
    TableName: TABLE_NAME,
  });
  const res = await docClient.send(cmd);
  return res.Items || [];
}

// Update institution status
async function updateInstitutionStatus(id, newStatus, tableName, keyName) {
  const validStatuses = ["pending", "verified", "rejected"];

  if (!validStatuses.includes(newStatus)) {
    throw new Error(
      "Invalid status value. Must be 'pending', 'verified', or 'rejected'."
    );
  }

  const cmd = new UpdateCommand({
    TableName: tableName,
    // Key: {[tableName==="teachers"?"teacherId":"institutionId"]: institutionId},
    Key: { [keyName]: id },
    UpdateExpression: "SET #s = :s",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":s": newStatus },
    ReturnValues: "ALL_NEW",
  });

  const res = await docClient.send(cmd);
  return res.Attributes;
}

// Update password for a student
async function updatePassword(id, newHashedPassword, tableName, keyName) {
  const cmd = new UpdateCommand({
    TableName: tableName,
    Key: { [keyName]: id },
    UpdateExpression: "SET passwordHash = :p",
    ExpressionAttributeValues: {
      ":p": newHashedPassword,
    },
    ReturnValues: "UPDATED_NEW",
  });

  const res = await docClient.send(cmd);
  return res.Attributes;
}

async function updateInstitutionProfile(id,updatefields){
  const expressionParts=[];
  const expressionValues ={};
  const expressionNames={};

  for(const[key,value] of Object.entries(updatefields)){
    expressionParts.push(`#${key} = :${key}`);
    expressionValues[`:${key}`]=value;
    expressionNames[`#${key}`]=key;
  }
  const UpdateExpression=`SET ${expressionParts.join(", ")}`;

  const cmd=new UpdateCommand({
    TableName:TABLE_NAME,
    Key:{ institutionId: id },
    UpdateExpression,
    ExpressionAttributeNames:expressionNames,
    ExpressionAttributeValues:expressionValues,
    ReturnValues:"ALL_NEW",
  });

  const result= await docClient.send(cmd);
  return result.Attributes;
}

module.exports = {
  createInstitution,
  findByEmail,
  findById,
  getAllInstitutions,
  updateInstitutionStatus,
  updatePassword,
  updateInstitutionProfile,
};
