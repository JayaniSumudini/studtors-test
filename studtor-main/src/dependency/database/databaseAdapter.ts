import { TableTypes, DetailTypes } from '../../constant/tableNames';

export interface DatabaseAdapter {
  createItem(tableName: TableTypes, param: any): Promise<any>;

  getItem(tableName: TableTypes, value: any): Promise<any>;

  updateItem(tableName: TableTypes, key: any, param: any): Promise<any>;

  deleteItem(tableName: TableTypes, param: any): Promise<void>;

  getAllItems(tableName: TableTypes): Promise<any>;

  getItemByPagination(
    tableName: TableTypes,
    itemsPerPage: number,
    lastEvaluatedKey?: object,
  ): Promise<any>;

  getFilteredItemsFromCommonTable(detailType: DetailTypes, values: string): Promise<any>;
}
