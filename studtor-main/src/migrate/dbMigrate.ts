import AWS = require('aws-sdk');
import { TableTypes } from '../constant/tableNames';
import universityList from './universityList';
import nationalityList from './nationalityList';
import languageList from './languageList';
import districtList from './districtList';
import subjectList from './subjectList';
import examList from './examList';
import atomicTable from './atomicTable';

AWS.config.update({
  region: 'us-east-1',
});

const dynamoDb = new AWS.DynamoDB();
const dynamoDbClient = new AWS.DynamoDB.DocumentClient();

async function createAtomicCounterTable() {
  await dynamoDb.createTable(
    {
      TableName: TableTypes.ATOMIC_COUNTER,
      KeySchema: [{ AttributeName: 'tableName', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'tableName', AttributeType: 'S' }],
      BillingMode: 'PAY_PER_REQUEST',
    },
    (err, data) => {
      if (err) {
        console.error('Unable to create table. Error JSON:', JSON.stringify(err, null, 2));
      } else {
        console.log('Created table. Table description JSON:', JSON.stringify(data, null, 2));
      }
    },
  );
}

async function addDataToAtomicCounterTable() {
  atomicTable.map((table) => {
    new Promise<any>(async (resolve, reject) => {
      await dynamoDbClient.put(
        {
          TableName: TableTypes.ATOMIC_COUNTER.toString(),
          Item: table,
          ConditionExpression: 'attribute_not_exists(id)',
        },
        (err, data) => {
          if (err) {
            console.error('Unable to add item. Error JSON:', JSON.stringify(err, null, 2));
            reject(err);
          } else {
            console.log('Added item:', JSON.stringify(table, null, 2));
            resolve(table);
          }
        },
      );
    });
  });
}

async function createContactNumberMappingTable() {
  await dynamoDb.createTable(
    {
      TableName: TableTypes.CONTACT_NUMBER_MAPPING,
      KeySchema: [{ AttributeName: 'contactNumber', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'contactNumber', AttributeType: 'S' }],
      BillingMode: 'PAY_PER_REQUEST',
    },
    (err, data) => {
      if (err) {
        console.error('Unable to create table. Error JSON:', JSON.stringify(err, null, 2));
      } else {
        console.log('Created table. Table description JSON:', JSON.stringify(data, null, 2));
      }
    },
  );
}

async function createClientEmailMappingTable() {
  await dynamoDb.createTable(
    {
      TableName: TableTypes.CLIENT_EMAIL_MAPPING,
      KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'email', AttributeType: 'S' }],
      BillingMode: 'PAY_PER_REQUEST',
    },
    (err, data) => {
      if (err) {
        console.error('Unable to create table. Error JSON:', JSON.stringify(err, null, 2));
      } else {
        console.log('Created table. Table description JSON:', JSON.stringify(data, null, 2));
      }
    },
  );
}

async function createClientDetailsTable() {
  await dynamoDb.createTable(
    {
      TableName: TableTypes.CLIENT_DETAILS,
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      BillingMode: 'PAY_PER_REQUEST',
    },
    (err, data) => {
      if (err) {
        console.error('Unable to create table. Error JSON:', JSON.stringify(err, null, 2));
      } else {
        console.log('Created table. Table description JSON:', JSON.stringify(data, null, 2));
      }
    },
  );
}

async function createVendorEmailMappingTable() {
  await dynamoDb.createTable(
    {
      TableName: TableTypes.VENDOR_EMAIL_MAPPING,
      KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'email', AttributeType: 'S' }],
      BillingMode: 'PAY_PER_REQUEST',
    },
    (err, data) => {
      if (err) {
        console.error('Unable to create table. Error JSON:', JSON.stringify(err, null, 2));
      } else {
        console.log('Created table. Table description JSON:', JSON.stringify(data, null, 2));
      }
    },
  );
}

async function createVendorDetailsTable() {
  await dynamoDb.createTable(
    {
      TableName: TableTypes.VENDOR_DETAILS,
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      BillingMode: 'PAY_PER_REQUEST',
    },
    (err, data) => {
      if (err) {
        console.error('Unable to create table. Error JSON:', JSON.stringify(err, null, 2));
      } else {
        console.log('Created table. Table description JSON:', JSON.stringify(data, null, 2));
      }
    },
  );
}

async function createLocationTable() {
  await dynamoDb.createTable(
    {
      TableName: TableTypes.LOCATION,
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
        { AttributeName: 'userId', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    },
    (err, data) => {
      if (err) {
        console.error('Unable to create table. Error JSON:', JSON.stringify(err, null, 2));
      } else {
        console.log('Created table. Table description JSON:', JSON.stringify(data, null, 2));
      }
    },
  );
}

async function createBookingTable() {
  await dynamoDb.createTable(
    {
      TableName: TableTypes.BOOKING,
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      BillingMode: 'PAY_PER_REQUEST',
    },
    (err, data) => {
      if (err) {
        console.error('Unable to create table. Error JSON:', JSON.stringify(err, null, 2));
      } else {
        console.log('Created table. Table description JSON:', JSON.stringify(data, null, 2));
      }
    },
  );
}

async function createCommonDetailsTable() {
  await dynamoDb.createTable(
    {
      TableName: TableTypes.COMMON_DETAILS,
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
        { AttributeName: 'detailType', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'detailType', AttributeType: 'S' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    },
    (err, data) => {
      if (err) {
        console.error('Unable to create table. Error JSON:', JSON.stringify(err, null, 2));
      } else {
        console.log('Created table. Table description JSON:', JSON.stringify(data, null, 2));
      }
    },
  );
}

async function addUniversitiesToCommonTable() {
  universityList.map((university) => {
    new Promise<any>(async (resolve, reject) => {
      await dynamoDbClient.put(
        {
          TableName: TableTypes.COMMON_DETAILS.toString(),
          Item: university,
          ConditionExpression: 'attribute_not_exists(id)',
        },
        (err, data) => {
          if (err) {
            console.error('Unable to add item. Error JSON:', JSON.stringify(err, null, 2));
            reject(err);
          } else {
            console.log('Added item:', JSON.stringify(university, null, 2));
            resolve(university);
          }
        },
      );
    });
  });
}

async function addNationalitiesToCommonTable() {
  nationalityList.map((nationality) => {
    new Promise<any>(async (resolve, reject) => {
      await dynamoDbClient.put(
        {
          TableName: TableTypes.COMMON_DETAILS.toString(),
          Item: nationality,
          ConditionExpression: 'attribute_not_exists(id)',
        },
        (err, data) => {
          if (err) {
            console.error('Unable to add item. Error JSON:', JSON.stringify(err, null, 2));
            reject(err);
          } else {
            console.log('Added item:', JSON.stringify(nationality, null, 2));
            resolve(nationality);
          }
        },
      );
    });
  });
}

async function addLanguagesToCommonTable() {
  languageList.map((language) => {
    new Promise<any>(async (resolve, reject) => {
      await dynamoDbClient.put(
        {
          TableName: TableTypes.COMMON_DETAILS.toString(),
          Item: language,
          ConditionExpression: 'attribute_not_exists(id)',
        },
        (err, data) => {
          if (err) {
            console.error('Unable to add item. Error JSON:', JSON.stringify(err, null, 2));
            reject(err);
          } else {
            console.log('Added item:', JSON.stringify(language, null, 2));
            resolve(language);
          }
        },
      );
    });
  });
}

async function addDistrictsToCommonTable() {
  districtList.map((district) => {
    new Promise<any>(async (resolve, reject) => {
      await dynamoDbClient.put(
        {
          TableName: TableTypes.COMMON_DETAILS.toString(),
          Item: district,
          ConditionExpression: 'attribute_not_exists(id)',
        },
        (err, data) => {
          if (err) {
            console.error('Unable to add item. Error JSON:', JSON.stringify(err, null, 2));
            reject(err);
          } else {
            console.log('Added item:', JSON.stringify(district, null, 2));
            resolve(district);
          }
        },
      );
    });
  });
}

async function addSubjectsToCommonTable() {
  subjectList.map((subject) => {
    new Promise<any>(async (resolve, reject) => {
      await dynamoDbClient.put(
        {
          TableName: TableTypes.COMMON_DETAILS.toString(),
          Item: subject,
          ConditionExpression: 'attribute_not_exists(id)',
        },
        (err, data) => {
          if (err) {
            console.error('Unable to add item. Error JSON:', JSON.stringify(err, null, 2));
            reject(err);
          } else {
            console.log('Added item:', JSON.stringify(subject, null, 2));
            resolve(subject);
          }
        },
      );
    });
  });
}

async function addExamsToCommonTable() {
  examList.map((exam) => {
    new Promise<any>(async (resolve, reject) => {
      await dynamoDbClient.put(
        {
          TableName: TableTypes.COMMON_DETAILS.toString(),
          Item: exam,
          ConditionExpression: 'attribute_not_exists(id)',
        },
        (err, data) => {
          if (err) {
            console.error('Unable to add item. Error JSON:', JSON.stringify(err, null, 2));
            reject(err);
          } else {
            console.log('Added item:', JSON.stringify(exam, null, 2));
            resolve(exam);
          }
        },
      );
    });
  });
}

async function deleteTable(tableName: TableTypes) {
  await dynamoDb.deleteTable(
    {
      TableName: tableName.toString(),
    },
    (err, data) => {
      if (err) {
        console.error('Unable to delete table. Error JSON:', JSON.stringify(err, null, 2));
      } else {
        console.log('Deleted table. Table description JSON:', JSON.stringify(data, null, 2));
      }
    },
  );
}

// deleteTable(TableTypes.ATOMIC_COUNTER);
// deleteTable(TableTypes.CONTACT_NUMBER_MAPPING);

// deleteTable(TableTypes.CLIENT_DETAILS);
// deleteTable(TableTypes.CLIENT_EMAIL_MAPPING);

// deleteTable(TableTypes.VENDOR_DETAILS);
// deleteTable(TableTypes.VENDOR_EMAIL_MAPPING);

// deleteTable(TableTypes.LOCATION);
// deleteTable(TableTypes.BOOKING);

// deleteTable(TableTypes.COMMON_DETAILS);

// createAtomicCounterTable();
// createContactNumberMappingTable();

// createClientDetailsTable();
// createClientEmailMappingTable();

// createVendorEmailMappingTable();
// createVendorDetailsTable();

// createCommonDetailsTable();

// createLocationTable();
// createBookingTable();

// addDataToAtomicCounterTable();

addUniversitiesToCommonTable();
addNationalitiesToCommonTable();
addLanguagesToCommonTable();
addDistrictsToCommonTable();
addSubjectsToCommonTable();
addExamsToCommonTable();
