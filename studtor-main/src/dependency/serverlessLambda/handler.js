'use strict';
const { Client } = require('@elastic/elasticsearch');

var ES_ENDPOINT = 'https://vpc-studtors-es-edhdlfe6mpdglhm25pqdnhtqvm.us-east-1.es.amazonaws.com';
const client = new Client({
  node: ES_ENDPOINT,
});

module.exports.es = async (event, context) => {
  console.log(JSON.stringify(event));

  for (var i = 0; i < event.Records.length; i++) {
    var record = event.Records[i];
    try {
      if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
        var splittedWord = record.eventSourceARN.split('/');
        var index = splittedWord[1].toLowerCase();
        var body = getBodyParamByTable(splittedWord[1], record.dynamodb.NewImage, record.eventName);
        var id = getIdByTable(splittedWord[1], record.dynamodb.NewImage);
        const result = await client
          .create({
            index: index,
            id: id,
            body: body,
          })
          .then((result) => result)
          .catch((error) => console.log(error));
        console.log(result);
      }
    } catch (err) {
      console.log(err);
    }
  }
  return `Successfully processed ${event.Records.length} records.`;
};

function getBodyParamByTable(tableName, newImage, eventName) {
  switch (tableName) {
    case 'VendorDetails':
      return eventName === 'INSERT'
        ? {
            id: newImage.id.S,
            fullName: newImage.fullName.S,
            profilePicS3Key: newImage.profilePicS3Key.S,
            yearsOfExperience: newImage.yearsOfExperience,
          }
        : {
            id: newImage.id.S,
            fullName: newImage.fullName.S,
            profilePicS3Key: newImage.profilePicS3Key.S,
            yearsOfExperience: newImage.yearsOfExperience,
            preferredSyllabusAndSubjects: newImage.preferredSyllabusAndSubjects,
          };
  }
}

function getIdByTable(tableName, newImage) {
  switch (tableName) {
    case 'VendorDetails':
      return newImage.id.S;
  }
}
