/* Admin-centric model class. */

import { RLAwsAPI } from './api.js';

const localStorage = window.localStorage;
const adminKey = 'rlAwsAdminCredentials';

export class RLAwsAdmin extends RLAwsAPI {

  constructor() {
  }

  getStoredCredentials() {
    let credentials = localStorage.getItem(adminKey);
    if (credentials) {
      // check the credentials online
      this._checkCredentials()
        .then((res) => true, (err) => {
          this.resetCredentials();
		  return null;
        });
    }
    return Promise.resolve(null);
  }

  login(username, password) {
    let newToken = null;
    this._authToken = newToken;
  }

  checkLogin() {
    return this.get("/auth/check")
      .then((resp) => {
        return true;
      }, (err) => {
        this._authToken = null;
        return false;
      });
  }

  isLoggedIn() {
    return !!this._authToken;
  }

  _checkCredentials(creds) {
    this.get("/student/check")
      .send(creds);
  }

  fetchNewCredentials() {
    return this.post("/student/newCredentials")
      .send({"please": true}) // well, nothing is really required
      .then((creds) => {
        this.storeCredentials(creds);
        return creds;
      }, (err) => {
        this.resetCredentials();
        return err;
      });
  }

  storeCredentials(creds) {
    localStorage.setItem(studentKey, creds);
  }

  resetCredentials(creds) {
    localStorage.removeItem(studentKey);
  }
}


