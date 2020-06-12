'use strict';
import AWS = require('aws-sdk');
import { Client, RequestParams } from '@elastic/elasticsearch';
import { injectable, inject } from 'inversify';
import { ElasticSearchQueryGenerator } from './elasticSearchQueryGenerator';
import { TableTypes } from '../../../constant/tableNames';
import { QueryFilters } from '../../../models/apiResponse';

const ES_ENDPOINT = 'https://vpc-studtors-es-edhdlfe6mpdglhm25pqdnhtqvm.us-east-1.es.amazonaws.com';
const client = new Client({ node: ES_ENDPOINT });

AWS.config.update({
  region: 'us-east-1',
});

@injectable()
export class ElasticSearchAdapterImpl {
  private queryGenerator: ElasticSearchQueryGenerator;

  constructor(@inject(ElasticSearchQueryGenerator) queryGenerator: ElasticSearchQueryGenerator) {
    this.queryGenerator = queryGenerator;
  }

  public async search(tableName: TableTypes, searchParams: string): Promise<any> {
    const params: RequestParams.Search = this.queryGenerator.searchItem(tableName, searchParams);

    return new Promise<any>((resolve, reject) => {
      client
        .search(params)
        .then((result) => {
          resolve(result.body.hits.hits);
        })
        .catch((err) => {
          resolve(err);
        });
    });
  }
}
