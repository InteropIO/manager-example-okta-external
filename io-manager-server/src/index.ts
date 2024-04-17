import { start, Config } from '@interopio/manager';

import { CustomOktaAuthenticator } from './CustomOktaAuthenticator.js';

const config: Config = {
  name: 'local',
  base: 'api',
  port: 4356,
  store: {
    type: 'mongo',

    // TODO: Replace this with your own MongoDB connection string.
    connection:
      'mongodb://mongo_user:mongo_password@localhost:4901/io_manager?authSource=admin',
  },
  token: {
    // TODO: Replace this with your secret.
    secret: '85611bfe-6439-4cb1-9146-fee9fe8a2943',
  },
  auth_method: 'custom',
  auth_custom: new CustomOktaAuthenticator(),
};

await start(config);
