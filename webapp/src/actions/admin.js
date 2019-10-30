import { RLAwsAdmin } from "../model/admin.js";
import { loadConfig } from "../model/config.js";

import { showAppError } from "./app.js";

export const ADMIN_UPDATE_AUTH = "ADMIN_UPDATE_AUTH";
export const ADMIN_UPDATE_LAB = "ADMIN_UPDATE_LAB";
export const ADMIN_UPDATE_AWS = 'ADMIN_UPDATE_AWS';
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
  if (!adminModel) {
    dispatch(showAppError(modelError));
    return;
  }
  adminModel.logout()
    .then((result) => {
      dispatch(_updateLogin(false, ''));
    });
};

export const fetchAwsData = () => (dispatch) => {
  if (!adminModel) {
    dispatch(showAppError(modelError));
    return;
  }
  adminModel.getAwsData()
    .then((awsData) => {
      dispatch({ type: ADMIN_UPDATE_AWS, data: awsData });
      dispatch(_actionResults('fetchAwsData', {success: true}));
    }, (err) => {
      dispatch(_actionResults('fetchAwsData', {error: err}));
    });
};

let refreshInterval = null;

export const startRefresh = () => (dispatch) => {
  if (!adminModel) {
    dispatch(showAppError(modelError));
    return;
  }
  // do an extra refresh, then setup the interval
  dispatch(fetchAwsData());
  if (refreshInterval) return;
  refreshInterval = setInterval(() => {
    dispatch(fetchAwsData());
  }, refreshTime * 1000);
};

export const stopRefresh = () => (dispatch) => {
  if (!refreshInterval) return;
  clearInterval(refreshInterval);
};

export const loadLabSettings = () => (dispatch) => {
  if (!adminModel) {
    dispatch(showAppError(modelError));
    return;
  }
  adminModel.getLabSettings()
    .then((labSettings) => {
      dispatch({
        type: ADMIN_UPDATE_LAB,
        lab: labSettings
      });
    }, (err) => {
      dispatch(_actionResults('changeLabPassword', {error: err}));
    });
};

export const changeLabPassword = (labPassword) => (dispatch) => {
  if (!adminModel) {
    dispatch(showAppError(modelError));
    return;
  }
  adminModel.changeLabPassword(labPassword)
    .then(() => {
      dispatch(_actionResults('changeLabPassword', {success: true}));
    }, (err) => {
      dispatch(_actionResults('changeLabPassword', {error: err}));
    });
};


