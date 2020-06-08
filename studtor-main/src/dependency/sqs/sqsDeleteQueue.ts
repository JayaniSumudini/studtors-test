import AWS = require('aws-sdk');

AWS.config.update({
  region: 'us-east-1',
});

const sqs = new AWS.SQS();

const params = {
  QueueUrl: 'SQS_QUEUE_URL',
};

sqs.deleteQueue(params, (err, data) => {
  if (err) {
    console.log('Error', err);
  } else {
    console.log('Success', data);
  }
});
