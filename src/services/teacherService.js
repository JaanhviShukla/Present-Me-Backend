//created for dynamodb operations related to teachers
const {PutCommand, QueryCommand, DeleteCommand, UpdateCommand}= require("@aws-sdk/lib-dynamodb");
const {docClient}= require('../dynamoDb');
const {findByEmail,findById}= require("./awsService");
const {v4:uuidv4}= require('uuid');
const bcrypt = require("bcrypt");
const { customAlphabet } = require('nanoid');


const TABLE_NAME="teachers";




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

// Generate 6-digit alphanumeric class code
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const generateClassCode = customAlphabet(alphabet, 6);


async function createClass({ className, createdBy }) {
  while (true) {
    const classCode = generateClassCode();

    const item = {
      classId: "c-" + uuidv4(),
      classCode,   // PK
      className,
      createdBy,
      joinRequests: [],
      students: [],
      createdAt: new Date().toISOString(),
    };

    try {
      await docClient.send(
        new PutCommand({
          TableName: "classes",
          Item: item,
          ConditionExpression: "attribute_not_exists(classCode)" 
        })
      );

      return item; // ✅ success, unique code
    } catch (err) {
      if (err.name === "ConditionalCheckFailedException") {
        // Duplicate → generate again
        continue;
      }
      throw err;
    }
  }
}

async function deleteClass(classCode) {
  const deleteCmd = new DeleteCommand({
    TableName: "classes",
    Key: {
      classCode: classCode
    },
    ConditionExpression: "attribute_exists(classCode)" 
    // ✅ ensures an error is thrown if class does NOT exist
  });

  try {
    await docClient.send(deleteCmd);
    return { success: true, message: "Class deleted successfully." };
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return { success: false, message: "Class does not exist." };
    }
    throw err; // other errors
  }
}

async function updateClassName(classCode, newClassName) {
  try {
    const cmd = new UpdateCommand({
      TableName: "classes",
      Key: { classCode },
      UpdateExpression: "SET className = :newName",
      ExpressionAttributeValues: {
        ":newName": newClassName
      },
      ConditionExpression: "attribute_exists(classCode)" 
      // ✅ ensures the class exists before updating
    });

    await docClient.send(cmd);

    return {
      success: true,
      message: "Class name updated successfully.",
    };
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return {
        success: false,
        message: "Class not found.",
      };
    }
    throw err;
  }
}


module.exports={createTeacher, createClass, deleteClass, updateClassName};
