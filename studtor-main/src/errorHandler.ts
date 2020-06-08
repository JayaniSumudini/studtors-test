import { Express, Request, Response, NextFunction } from 'express';
import { APIResponse } from './models/apiResponse';

export default (app: Express) => {
  app.use(
    (error: any, _request: Request, response: Response, next: NextFunction) => {
      if (error) {
        if (error.status === 400 && error.name === 'ValidateError') {
          const errors = {};

          for (const key in error.fields) {
            if (key) {
              errors[key.replace('request.', '')] = error.fields[
                key
              ].message.replace(/'/g, '');
            }
          }

          const apiResponse: APIResponse = {
            message: error.name,
            errors,
          };
          response.status(error.status);
          response.send(apiResponse);
        } else if (error.status === 401) {
          const apiResponse: APIResponse = {
            message: error.message,
          };
          response.status(400);
          response.send(apiResponse);
        } else {
          const apiResponse: APIResponse = {
            message: error.message,
          };

          response.status(500);
          response.send(apiResponse);
        }
      }
      next();
    }
  );
};
