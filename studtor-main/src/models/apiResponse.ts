export interface APIResponse {
  message?: string;
  data?: any;
  errors?: any;
}
export interface QueryFilters {
  [x: string]: string;
}
