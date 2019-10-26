/* Implements the RESTful API client with the management service. */

import 'superagent/dist/superagent.js';

const globalTimeout = 30000; // milliseconds

export class RLAwsAPI {
  constructor(options) {
    this._apiServer = options.apiServer;
    this._authToken = options.authToken;
    this._rebuildClient();
  }

  setAuthToken(authToken) {
    this._authToken = authToken;
    this._rebuildClient();
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
  post(path, query) {
    if (!query) query = null;
    return this._client.post(this._apiServer + path);
  }

  // normalizes the response error to a string message 
  _errorMessage(err) {
    if (!err.response) {
      return "unexpected error" + (err ? " (" + err + ")": "");
    }
    if (err.response.body && err.response.body.message)
      return err.response.body.message;
    return "unexpected error (" + err.response.status + ")";
  }
  
}


