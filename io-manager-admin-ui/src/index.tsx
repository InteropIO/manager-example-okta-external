import ReactDOM from 'react-dom';
import React, { StrictMode } from 'react';

import { OktaAuth } from '@okta/okta-auth-js';

import { App } from './App';
import { CustomOktaProvider } from './CustomOktaProvider';

// TODO: Specify the appropriate okta client options here.
const oktaAuth = new OktaAuth({
  issuer: 'https://trial-8928888.okta.com',
  clientId: '0oad61o511I0CQ7Sr697',

  redirectUri: location.origin + '/login/callback',
});

ReactDOM.render(
  <StrictMode>
    <CustomOktaProvider oktaAuth={oktaAuth} defaultOriginalUrl="/">
      <App />
    </CustomOktaProvider>
  </StrictMode>,
  document.getElementById('root')!
);
