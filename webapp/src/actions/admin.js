import { RLAwsAdmin } from "../model/admin.js";
import { loadConfig } from "../model/config.js";

import { showAppError } from "./app.js";

export const ADMIN_UPDATE_AUTH = "ADMIN_UPDATE_AUTH";
export const ADMIN_UPDATE_USERS = 'ADMIN_UPDATE_USERS';
export const ADMIN_UPDATE_RESOURCES = 'ADMIN_UPDATE_RESOURCES';
export const ADMIN_UPDATE_ACTION = 'ADMIN_UPDATE_ACTION';

const refreshTime = 10; // seconds

let adminModel = null;
let modelPromise = loadConfig().then((apiConfig) => {
  adminModel = new RLAwsAdmin({
    apiServer: apiConfig.apiURL,
  });
});
const modelError = "Application failed to load properly";

let _updateLogin = (status, err) => {
  if (!err) err = '';
  return { type: ADMIN_UPDATE_AUTH, authStatus: status, authError: err };
};
let _actionResults = (name, status) => {
  return { type: ADMIN_UPDATE_ACTION, name, status };
};

export const loadAdminCredentials = () => (dispatch) => {
  // this executes at page load, so retry if model not available
  if (!adminModel) {
    modelPromise.then(() => {
      return loadAdminCredentials()(dispatch);
    }, (err) => {
      dispatch(showAppError(modelError + ": " + err));
    });
    return;
  }
  adminModel.getStoredCredentials().then((credentials) => {
    if (credentials) {
      dispatch(_updateLogin(true));
    } else {
      dispatch(_updateLogin(false));
    }
  }, (err) => {
    dispatch(_updateLogin(false, err));
  });
};


export const loginAdmin = (username, password) => (dispatch) => {
  if (!adminModel) {
    dispatch(showAppError(modelError));
    return;
  }
  let authToken = null;
  let authFailed = '';

  adminModel.login(username, password)
    .then((result) => {
      dispatch(_updateLogin(true));
    }, (err) => {
      dispatch(_updateLogin(false, err));
    });
};

export const logoutAdmin = () => (dispatch) => {
  adminModel.logout()
    .then((result) => {
      dispatch(_updateLogin(false, ''));
    });
};

export const loadStudentUsers = () => (dispatch) => {
  adminModel.getAwsUsers()
    .then((users) => {
      // store the users as map
      let usersMap = users.reduce((obj, user) => {
        obj[user.username] = user;
        return obj;
      }, {});
      dispatch({ type: ADMIN_UPDATE_USERS, users: usersMap });
      dispatch(_actionResults('loadStudentUsers', {success: true}));
    }, (err) => {
      dispatch(_actionResults('loadStudentUsers', {error: err}));
    });
};

let usersRefreshInterval = null;

export const startUsersRefresh = () => (dispatch) => {
  // do an extra refresh, then setup the interval
  dispatch(loadStudentUsers());
  if (usersRefreshInterval) return;
  usersRefreshInterval = setInterval(() => {
    dispatch(loadStudentUsers());
  }, refreshTime * 1000);
};

export const stopUsersRefresh = () => (dispatch) => {
  if (!usersRefreshInterval) return;
  clearInterval(usersRefreshInterval);
};


