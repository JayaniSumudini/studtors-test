import * as express from 'express';
import { verify } from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'my@#$secret';

export function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  if (securityName === 'jwt') {
    let token = request.headers.authorization;

    return new Promise((resolve, reject) => {
      if (!token) {
        reject(new Error('No token provided'));
      } else {
        if (token.startsWith('Bearer ')) {
          // Remove Bearer from string
          token = token.replace(/Bearer /g, '');
        } else {
          reject(new Error('Invalid token'));
        }
      }

      verify(token, secret, (err: any, decoded: any) => {
        if (err) {
          reject(err);
        } else {
          if (scopes) {
            // Check if JWT contains all required scopes
            for (const scope of scopes) {
              if (!decoded.scopes.includes(scope)) {
                reject(new Error('JWT does not contain required scope.'));
              }
            }
            resolve(decoded);
          }
        }
      });
    });
  }
  return Promise.reject({});
}
