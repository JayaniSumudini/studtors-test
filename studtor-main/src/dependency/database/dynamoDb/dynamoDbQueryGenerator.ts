import { injectable } from 'inversify';
import { TableTypes, DetailTypes } from '../../../constant/tableNames';
import { DbParam } from '../../../models/dbParam';
import { DbOperations } from '../../../constant/dbOperations';
import { TransactWriteItemsInput, TransactGetItemsInput } from 'aws-sdk/clients/dynamodb';

@injectable()
export class DynamoDbQueryGenerator {
  public createItem(tableName: TableTypes, item: any): AWS.DynamoDB.DocumentClient.PutItemInput {
    return {
      TableName: tableName.toString(),
      Item: item,
      ConditionExpression: 'attribute_not_exists(id)',
    };
  }

  public getItemByKey(tableName: TableTypes, value: any): AWS.DynamoDB.DocumentClient.GetItemInput {
    return {
      TableName: tableName.toString(),
      Key: value,
    };
  }

  public updateItem(
    tableName: TableTypes,
    key: any,
    values: any,
  ): AWS.DynamoDB.DocumentClient.UpdateItemInput {
    const { updateQuery, expressionAttributeValues } = this.generateUpdateExpression(values);
    return {
      TableName: tableName.toString(),
      Key: key,
      UpdateExpression: updateQuery,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'UPDATED_NEW',
    };
  }

  public deleteItem(
    tableName: TableTypes,
    value: any,
  ): AWS.DynamoDB.DocumentClient.DeleteItemInput {
    return {
      TableName: tableName.toString(),
      Key: value,
    };
  }

  public getAllItems(tableName: TableTypes): AWS.DynamoDB.DocumentClient.ScanInput {
    return {
      TableName: tableName.toString(),
    };
  }

  public getItemByPagination(
    tableName: TableTypes,
    itemsPerPage: number,
    lastEvaluatedKey?: object,
  ): AWS.DynamoDB.DocumentClient.QueryInput {
    const params: AWS.DynamoDB.DocumentClient.ScanInput = {
      TableName: tableName.toString(),
      Limit: itemsPerPage,
    };

    if (lastEvaluatedKey) {
      // set ExclusiveStartKey only when server get complete lastEvaluatedKey as sent by it
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    return params;
  }

  public transactWriteItems(transactItems: DbParam[]): TransactWriteItemsInput {
    const paramArray = [];

    transactItems.forEach((item) => {
      const { tableName, values, key, dbOperation } = item;
      switch (dbOperation) {
        case DbOperations.PUT:
          paramArray.push({
            Put: this.createItem(tableName, values),
          });
          break;

        case DbOperations.UPDATE:
          paramArray.push({
            Update: this.updateItem(tableName, key, values),
          });
          break;

        case DbOperations.DELETE:
          paramArray.push({
            Delete: this.deleteItem(tableName, values),
          });
          break;
      }
    });

    return { TransactItems: paramArray };
  }

  public transactGetItems(transactItems: DbParam[]): TransactGetItemsInput {
    const paramArray = [];

    transactItems.forEach((item) => {
      const { tableName, values } = item;
      paramArray.push({
        Get: this.getItemByKey(tableName, values),
      });
    });

    return { TransactItems: paramArray };
  }

  public getId(tableName: TableTypes): AWS.DynamoDB.DocumentClient.UpdateItemInput {
    return {
      TableName: 'AtomicCounter',
      Key: {
        tableName: tableName.toString(),
      },
      UpdateExpression: 'SET id = id + :inc',
      ExpressionAttributeValues: {
        ':inc': 1,
      },
      ReturnValues: 'UPDATED_NEW',
    };
  }

  public getFilteredItemsFromCommonTable(
    detailType: DetailTypes,
    values: string,
  ): AWS.DynamoDB.DocumentClient.ScanInput {
    return {
      TableName: 'CommonDetails',
      ProjectionExpression: `id, ${values}`,
      FilterExpression: 'detailType = :detailType',
      ExpressionAttributeValues: {
        ':detailType': detailType.toString(),
      },
    };
  }

  private generateUpdateExpression(values: any) {
    let updateQuery = 'set ';
    const expressionAttributeValues = {};
    let i = 0;
    for (const key in values) {
      if (key) {
        expressionAttributeValues[`:${key}`] = values[key];
        updateQuery = `${updateQuery} ${i === 0 ? '' : ','}${key} = :${key}`;
        i++;
      }
    }

    return { updateQuery, expressionAttributeValues };
  }
}
