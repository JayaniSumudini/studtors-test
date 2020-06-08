import AWS = require('aws-sdk');
import { injectable, inject } from 'inversify';
import { DatabaseAdapter } from '../databaseAdapter';
import { DynamoDbQueryGenerator } from './dynamoDbQueryGenerator';
import { TableTypes, DetailTypes } from '../../../constant/tableNames';
import {
  PutItemInput,
  GetItemInput,
  UpdateItemInput,
  DeleteItemInput,
  ScanInput,
  TransactWriteItemsInput,
  TransactGetItemsInput,
  ItemResponseList,
  ScanOutput,
} from 'aws-sdk/clients/dynamodb';
import { DbParam } from '../../../models/dbParam';

AWS.config.update({
  region: 'us-east-1',
});

const docClient = new AWS.DynamoDB.DocumentClient();

@injectable()
export class DynamoDbAdapterImpl implements DatabaseAdapter {
  private queryGenerator: DynamoDbQueryGenerator;

  constructor(@inject(DynamoDbQueryGenerator) queryGenerator: DynamoDbQueryGenerator) {
    this.queryGenerator = queryGenerator;
  }

  public async createItem(tableName: TableTypes, param: any): Promise<any> {
    const createQueryParam: PutItemInput = this.queryGenerator.createItem(tableName, param);

    return new Promise<any>((resolve, reject) => {
      docClient.put(createQueryParam, (err, data) => {
        if (err) {
          console.error('Unable to add item. Error JSON:', JSON.stringify(err, null, 2));
          reject(err);
        } else {
          console.log('Added item:', JSON.stringify(createQueryParam.Item, null, 2));
          resolve(createQueryParam.Item);
        }
      });
    });
  }

  public async getItem(tableName: TableTypes, value: any): Promise<any> {
    const getQueryParam: GetItemInput = this.queryGenerator.getItemByKey(tableName, value);

    return new Promise<any>((resolve, reject) => {
      docClient.get(getQueryParam, (err, data) => {
        if (err) {
          console.error('Unable to read item. Error JSON:', JSON.stringify(err, null, 2));
          reject(err);
        } else {
          console.log('Get Item succeeded:', JSON.stringify(data, null, 2));
          resolve(data.Item);
        }
      });
    });
  }

  public async updateItem(tableName: TableTypes, key: any, values: any): Promise<any> {
    const updateQueryParam: UpdateItemInput = this.queryGenerator.updateItem(
      tableName,
      key,
      values,
    );

    return new Promise<any>((resolve, reject) => {
      docClient.update(updateQueryParam, (err, data) => {
        if (err) {
          console.error('Unable to update item. Error JSON:', JSON.stringify(err, null, 2));
          reject(err);
        } else {
          console.log('Update Item succeeded:', JSON.stringify(data, null, 2));
          resolve(data.Attributes);
        }
      });
    });
  }

  public async deleteItem(tableName: TableTypes, param: any): Promise<void> {
    const deleteQueryParam: DeleteItemInput = this.queryGenerator.deleteItem(tableName, param);

    return new Promise<void>((resolve, reject) => {
      docClient.delete(deleteQueryParam, (err, data) => {
        if (err) {
          console.error('Unable to delete item. Error JSON:', JSON.stringify(err, null, 2));
          reject(err);
        } else {
          console.log('Delete Item succeeded:', JSON.stringify(data, null, 2));
          resolve();
        }
      });
    });
  }

  public async getAllItems(tableName: TableTypes): Promise<any> {
    const getAllItemsQueryParam: ScanInput = this.queryGenerator.getAllItems(tableName);

    return new Promise<any>((resolve, reject) => {
      docClient.scan(getAllItemsQueryParam, (err, data) => {
        if (err) {
          console.error('Unable to get all items. Error JSON:', JSON.stringify(err, null, 2));
          reject(err);
        } else {
          console.log('Get all Items succeeded:', JSON.stringify(data, null, 2));
          resolve(data.Items);
        }
      });
    });
  }

  public async transactWriteItems(transactItems: DbParam[]): Promise<any> {
    const transactWriteItemsQueryParam: TransactWriteItemsInput = this.queryGenerator.transactWriteItems(
      transactItems,
    );

    return new Promise<any>((resolve, reject) => {
      docClient.transactWrite(transactWriteItemsQueryParam, (err, data) => {
        if (err) {
          console.error('Transaction Failed. Error JSON:', JSON.stringify(err, null, 2));
          reject(err);
        } else {
          console.log('Transaction succeeded:', JSON.stringify(data, null, 2));
          resolve(data);
        }
      });
    });
  }

  public async transactGetItems(transactItems: DbParam[]): Promise<ItemResponseList> {
    const transactGetItemsQueryParam: TransactGetItemsInput = this.queryGenerator.transactGetItems(
      transactItems,
    );

    return new Promise<any>((resolve, reject) => {
      docClient.transactGet(transactGetItemsQueryParam, (err, data) => {
        if (err) {
          console.error('Transaction Failed. Error JSON:', JSON.stringify(err, null, 2));
          reject(err);
        } else {
          console.log('Transaction succeeded:', JSON.stringify(data, null, 2));
          resolve(data.Responses);
        }
      });
    });
  }

  public async getItemByPagination(
    tableName: TableTypes,
    itemsPerPage: number,
    lastEvaluatedKey?: object,
  ): Promise<any> {
    let searchQueryParam: ScanInput;
    if (lastEvaluatedKey) {
      searchQueryParam = this.queryGenerator.getItemByPagination(
        tableName,
        itemsPerPage,
        lastEvaluatedKey,
      );
    } else {
      searchQueryParam = this.queryGenerator.getItemByPagination(tableName, itemsPerPage);
    }

    return new Promise<any>((resolve, reject) => {
      docClient.scan(searchQueryParam, (err, data: ScanOutput) => {
        if (err) {
          console.error('Transaction Failed. Error JSON:', JSON.stringify(err, null, 2));
          reject(err);
        } else {
          console.log('Transaction succeeded:', JSON.stringify(data, null, 2));
          resolve({ data: data.Items, lastEvaluatedKey: data.LastEvaluatedKey });
        }
      });
    });
  }

  public async getId(tableName: TableTypes): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const updateQueryParam: UpdateItemInput = this.queryGenerator.getId(tableName);

      docClient.update(updateQueryParam, (err, data) => {
        if (err) {
          console.error('Unable to update item. Error JSON:', JSON.stringify(err, null, 2));
          reject(err);
        } else {
          console.log('Update Item succeeded:', JSON.stringify(data, null, 2));
          resolve(data.Attributes);
        }
      });
    });
  }

  public async getFilteredItemsFromCommonTable(
    detailType: DetailTypes,
    values: string,
  ): Promise<any> {
    const scanParam: ScanInput = this.queryGenerator.getFilteredItemsFromCommonTable(
      detailType,
      values,
    );

    return new Promise<any>((resolve, reject) => {
      docClient.scan(scanParam, (err, data) => {
        if (err) {
          console.error('Unable to get items. Error JSON:', JSON.stringify(err, null, 2));
          reject(err);
        } else {
          console.log('Get all Items succeeded:', JSON.stringify(data, null, 2));
          resolve(data.Items);
        }
      });
    });
  }
}
