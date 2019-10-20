/* Implements the RESTful API client with the management service. */

const superagent = require('superagent');

const globalTimeout = 30000; // milliseconds


export class RLAwsAPI {
  constructor(options) {
    this._apiServer = options.apiServer;
    this._authToken = options.authToken;
  }

  _rebuildClient() {
    this._client = superagent.agent()
      .timeout(globalTimeout)
      .type('json')
      .accept('json')
      .set('X-Auth-Token', this._authToken);
  }

  get(path, query) {
    if (!query) query = null;
    return this._client.get(this._apiServer + path)
      .query(query);
  }
}


export const getAPIConfig = (localUrl) => {
  return superagent.get("/serverConfig.json")
    .timeout(5000)
    .accept('json');
};

