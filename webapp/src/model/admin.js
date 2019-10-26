/* Admin-centric model class. */

import { RLAwsAPI } from './api.js';

const localStorage = window.localStorage;
const adminKey = 'rlAwsAdminCredentials';


export class RLAwsAdmin extends RLAwsAPI {

  constructor(options) {
    super(options);
  }

  getStoredCredentials() {
    let credentials = null;
    try {
      credentials = localStorage.getItem(adminKey);
      if (credentials)
        credentials = JSON.parse(credentials);
    } catch(e) {
      if (console.error)
        console.error("Invalid localStorage object", e);
    }
    if (credentials) {
      // check the auth token
      return this._checkCredentials(credentials)
        .then((resp) => true)
        .catch((err) => {
          this.resetCredentials();
          return null;
        });
    }
    return Promise.resolve(null);
  }

  login(username, password) {
    return this.post("/admin/login")
      .send({
        username: username,
        password: password,
      })
      .then((resp) => {
        let creds = { token: resp.body.auth_token };
        this.setAuthToken(creds.token);
        this.storeCredentials(creds);
        return creds;
      }, (err) => {
        this.resetCredentials();
        throw this._errorMessage(err);
      });
  }

  logout() {
    this.resetCredentials();
    return Promise.resolve(true);
  }

  _checkCredentials(credentials) {
    return this.get("/admin/check")
      .set('X-Auth-Token', credentials.token)
      .then((resp) => {
        this.setAuthToken(credentials.token);
        return true;
      }, (err) => {
        this._authToken = null;
        throw err;
      });
  }

  isLoggedIn() {
    return !!this._authToken;
  }

  storeCredentials(creds) {
    // only store the username and the token
    localStorage.setItem(adminKey, JSON.stringify(creds));
  }

  resetCredentials(creds) {
    this.setAuthToken(null);
    localStorage.removeItem(adminKey);
  }
}


