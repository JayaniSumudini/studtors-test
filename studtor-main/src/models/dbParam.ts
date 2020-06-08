import { DbOperations } from '../constant/dbOperations';
import { TableTypes } from '../constant/tableNames';

export interface DbParam {
  tableName: TableTypes;
  values: any;
  key?: any;
  dbOperation?: DbOperations;
}
