/* Student-centric model class. */

import { RLAwsAPI } from './api.js';

const localStorage = window.localStorage;
const studentKey = 'rlAwsStudentCredentials';

export class RLAwsStudent extends RLAwsAPI {

  constructor(options) {
    super(options);
  }

  getStoredCredentials() {
    let credentials = null;
    try {
      credentials = localStorage.getItem(studentKey);
      if (credentials)
        credentials = JSON.parse(credentials);
    } catch(e) {
      if (console.error)
        console.error("Invalid localStorage object", e);
    }
    if (credentials) {
      // check the credentials online
      return this._checkCredentials(credentials)
        // response has extra data, so return it instead
        .then((resp) => resp.body)
        .catch((err) => {
          this.resetCredentials();
          return null;
        });
    }
    return Promise.resolve(null);
  }

  _checkCredentials(creds) {
    return this.post("/student/check")
      .send(creds);
  }

  fetchNewCredentials(labPassword) {
    return this.post("/student/newCredentials")
      .send({"labPassword": labPassword})
      .then((resp) => {
        let creds = resp.body;
        this.storeCredentials(creds);
        return creds;
      })
      .catch((err) => {
        this.resetCredentials();
        throw this._errorMessage(err);
      });
  }

  storeCredentials(creds) {
    // only store the username and the token
    localStorage.setItem(studentKey, JSON.stringify({
        username: creds.username,
        token: creds.token,
      }));
  }

  resetCredentials(creds) {
    localStorage.removeItem(studentKey);
  }
}

