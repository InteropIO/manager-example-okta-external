import ReactDOM from 'react-dom';
import React, { StrictMode } from 'react';

import { OktaAuth } from '@okta/okta-auth-js';

import { App } from './App';
import { CustomOktaProvider } from './CustomOktaProvider';

console.log(
  '[io.Manager Admin UI Auth] Initializing. location.href =',
  location.href
);

// TODO: Specify the appropriate okta client options here.
const oktaAuth = new OktaAuth({
  issuer: 'https://trial-8928888.okta.com/oauth2/default',
  clientId: '0oad61o511I0CQ7Sr697',

  redirectUri: location.origin + '/login/callback',
});

console.log('[io.Manager Admin UI Auth] SDK initialized.');

ReactDOM.render(
  <StrictMode>
    <CustomOktaProvider oktaAuth={oktaAuth} defaultOriginalUrl="/admin">
      <App />
    </CustomOktaProvider>
  </StrictMode>,
  document.getElementById('root')!
);
