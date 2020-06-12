import { injectable } from 'inversify';
import { RequestParams } from '@elastic/elasticsearch';
import { TableTypes } from '../../../constant/tableNames';
import { QueryFilters } from '../../../models/apiResponse';

@injectable()
export class ElasticSearchQueryGenerator {
  public searchItem(tableName: TableTypes, searchParam: string): RequestParams.Search {
    return {
      index: tableName.toLowerCase(),
      body: {
        query: {
          match: this.generateMatchExpression(searchParam),
        },
      },
    };
  }

  private generateMatchExpression(searchParam: string): object {
    const matchQuery = {};
    // const keyValues: string[] = searchParam.split('&');
    // for (const keyValue of searchParam) {
    //   if (keyValue) {
    //     const splittedKeyValue: string[] = keyValue.split('=');
    //     matchQuery[splittedKeyValue[0]] = {
    //       query: splittedKeyValue[1],
    //     };
    //   }
    // }

    return matchQuery;
  }
}
