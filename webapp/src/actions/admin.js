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

let _updateLogin = (status) => {
  return { type: ADMIN_UPDATE_AUTH, authStatus: status };
};

export const setActionResults = (name, results) => {
  return { type: ADMIN_UPDATE_ACTION, name, results };
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
  dispatch(setActionResults("auth", {loading: true}));
  adminModel.getStoredCredentials().then((credentials) => {
    if (credentials) {
      dispatch(_updateLogin(true));
    } else {
      dispatch(_updateLogin(false));
    }
  }, (err) => {
    dispatch(_updateLogin(false));
    dispatch(setActionResults("auth", {error: err}));
  });
};


export const loginAdmin = (username, password) => (dispatch) => {
  if (!adminModel) {
    dispatch(showAppError(modelError));
    return;
  }
  dispatch(setActionResults("auth", null));

  dispatch(setActionResults("auth", {loading: true}));
  adminModel.login(username, password)
    .then((result) => {
      dispatch(_updateLogin(true));
    }, (err) => {
      dispatch(_updateLogin(false));
      dispatch(setActionResults("auth", {error: err}));
    });
};

export const logoutAdmin = () => (dispatch) => {
  if (!adminModel) {
    dispatch(showAppError(modelError));
    return;
  }
  adminModel.logout()
    .then((result) => {
      dispatch(_updateLogin(false));
    });
};

export const fetchAwsData = (firstTime) => (dispatch) => {
  if (!adminModel) {
    dispatch(showAppError(modelError));
    return;
  }
  if (firstTime)
    dispatch(setActionResults("fetchAwsData", {loading: true}));
  adminModel.getAwsData()
    .then((awsData) => {
      dispatch({ type: ADMIN_UPDATE_AWS, data: awsData });
      dispatch(setActionResults('fetchAwsData', {success: true}));
    }, (err) => {
      dispatch(setActionResults('fetchAwsData', {error: err}));
    });
};

let refreshInterval = null;

export const startRefresh = () => (dispatch) => {
  if (!adminModel) {
    dispatch(showAppError(modelError));
    return;
  }
  // do an extra refresh, then setup the interval
  dispatch(fetchAwsData(true));
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
  dispatch(setActionResults("loadLabSettings", {loading: true}));
  adminModel.getLabSettings()
    .then((labSettings) => {
      dispatch({
        type: ADMIN_UPDATE_LAB,
        lab: labSettings
      });
    }, (err) => {
      dispatch(setActionResults('loadLabSettings', {error: err}));
    });
};

export const changeLabPassword = (labPassword) => (dispatch) => {
  if (!adminModel) {
    dispatch(showAppError(modelError));
    return;
  }
  dispatch(setActionResults("changeLabPassword", {loading: true}));
  adminModel.changeLabPassword(labPassword)
    .then(() => {
      dispatch(setActionResults('changeLabPassword', {success: true}));
    }, (err) => {
      dispatch(setActionResults('changeLabPassword', {error: err}));
    });
};

export const cleanAwsResources = (username, all) => (dispatch) => {
  if (!adminModel) {
    dispatch(showAppError(modelError));
    return;
  }
  dispatch(setActionResults("cleanAwsResources", {loading: true}));
  adminModel.cleanAwsResources(username, all)
    .then(() => {
      dispatch(setActionResults('cleanAwsResources', {success: true}));
    }, (err) => {
      dispatch(setActionResults('cleanAwsResources', {error: err}));
    });
};

export const deallocateUser = (username, all) => (dispatch) => {
  if (!adminModel) {
    dispatch(showAppError(modelError));
    return;
  }
  dispatch(setActionResults("deallocateUser", {loading: true}));
  adminModel.deallocateUser(username, all)
    .then(() => {
      dispatch(setActionResults('deallocateUser', {success: true}));
    }, (err) => {
      dispatch(setActionResults('deallocateUser', {error: err}));
    });
};


