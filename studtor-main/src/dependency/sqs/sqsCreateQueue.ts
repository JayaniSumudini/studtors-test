import AWS = require('aws-sdk');

AWS.config.update({
  region: 'us-east-1',
});

const sqs = new AWS.SQS();

const params = {
  QueueName: 'SQS_QUEUE_NAME',
  Attributes: {
    DelaySeconds: '60',
    MessageRetentionPeriod: '86400',
  },
};

sqs.createQueue(params, (err, data) => {
  if (err) {
    console.log('Error', err);
  } else {
    console.log('Success', data.QueueUrl);
  }
});
