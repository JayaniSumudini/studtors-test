"use strict";
const { Client } = require("@elastic/elasticsearch");

var ES_ENDPOINT =
  "https://vpc-studtors-es-edhdlfe6mpdglhm25pqdnhtqvm.us-east-1.es.amazonaws.com";
var INDEX = "VendorDetails";
const client = new Client({
  node: ES_ENDPOINT,
});

module.exports.es = async (event, context) => {
  console.log(JSON.stringify(event));

  for (var i = 0; i < event.Records.length; i++) {
    var record = event.Records[i];
    try {
      if (record.eventName === "INSERT") {
        const result = await client
          .create({
            index: "details",
            type: "VendorDetails",
            id: record.dynamodb.NewImage.id.S,
            body: {
              id: record.dynamodb.NewImage.id.S,
              nationalityId: record.dynamodb.NewImage.nationalityId.S,
              joiningDate: record.dynamodb.NewImage.joiningDate.S,
            },
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
