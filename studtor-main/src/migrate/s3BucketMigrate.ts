// Load the AWS SDK for Node.js
import AWS = require('aws-sdk');
// Set the region
AWS.config.update({
  region: 'us-east-1',
});
// Create S3 service object
const s3 = new AWS.S3();

// Create the parameters for calling createBucket
const bucketParams = {
  Bucket: 'studtors',
  ACL: 'Not public',
};

// call S3 to create the bucket
s3.createBucket(bucketParams, (err, data) => {
  if (err) {
    console.log('Error', err);
  } else {
    console.log('Success', data.Location);
  }
});
