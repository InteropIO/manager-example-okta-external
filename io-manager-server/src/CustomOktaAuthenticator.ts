import type { Request, Response } from 'express';

import OktaJwtVerifier from '@okta/jwt-verifier';

import { CustomAuthenticator } from '@interopio/manager';
import { User } from '@interopio/manager-api';
import { UnauthorizedError } from '@interopio/manager/src/libs/rest/server/model/errors.js';

export class CustomOktaAuthenticator implements CustomAuthenticator {
  #oktaVerifier: OktaJwtVerifier;
  #audiences: string[];

  initialize() {
    // TODO: Specify the appropriate okta verifier options here.
    this.#oktaVerifier = new OktaJwtVerifier({
      issuer: 'https://trial-8928888.okta.com',
      jwksUri: 'https://trial-8928888.okta.com/oauth2/v1/keys',
    });

    // TODO: Specify the appropriate audiences here.
    this.#audiences = ['https://trial-8928888.okta.com'];
  }

  authenticate(
    req: Request,
    res: Response,
    next: (err?: Error, info?: User) => void
  ) {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
      next(new UnauthorizedError('Missing or empty "Authorization" header.'));
      return;
    }

    const parts = authorizationHeader.split(' ');
    const tokenType = parts[0];
    const tokenValue = parts[1];

    if (tokenType !== 'Bearer') {
      next(
        new UnauthorizedError(
          `Expected a "Bearer" token, found "${tokenType}".`
        )
      );
      return;
    }

    this.#oktaVerifier
      .verifyAccessToken(tokenValue, this.#audiences)
      .then((jwt) => {
        const user: User = {
          id: jwt.claims.sub,
          apps: [],

          // TODO: Specify the io.Manager groups for the user.
          //
          // The `GLUE42_SERVER_ADMIN` group below grants admin access
          // (needed for the Admin UI) and is for demonstration purposes only,
          // it should not be granted to all users.
          groups: ['GLUE42_SERVER_ADMIN'],
        };

        next(undefined, user);
      })
      .catch((error) => {
        console.error(error);
        next(new UnauthorizedError('Failed to verify access token.'));
      });
  }
}
