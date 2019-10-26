import { RLAwsStudent } from "../model/student.js";
import { loadConfig } from "../model/config.js";

import { showAppError } from "./app.js";

export const STUDENT_UPDATE = "STUDENT_LOGIN";

let studentModel = null;
let studentPromise = loadConfig().then((apiConfig) => {
  studentModel = new RLAwsStudent({
    apiServer: apiConfig.apiURL,
  });
});
const modelError = "Application failed to load properly";

let running = {};

let _setStudentCreds = (creds, err) => {
  if (!err) err = '';
  return { type: STUDENT_UPDATE,
    studentCreds: creds, studentAuthFailed: err, loadingFinished: true };
};

export const loadStudentCredentials = () => (dispatch) => {
  // this executes at page load, so retry if model not available
  if (!studentModel) {
    studentPromise.then(() => {
      return loadStudentCredentials()(dispatch);
    }, (err) => {
      dispatch(showAppError(modelError + ": " + err));
    });
    return;
  }

  studentModel.getStoredCredentials().then((credentials) => {
    dispatch(_setStudentCreds(credentials));
  }, (err) => {
    dispatch(_setStudentCreds(null));
  });
};

export const loginStudent = (labPassword) => (dispatch) => {
  if (running.loginStudent)
    return;
  if (!studentModel) {
    dispatch(showAppError(modelError));
    return;
  }

  running.loginStudent = studentModel.fetchNewCredentials(labPassword)
    .then((result) => {
      dispatch(_setStudentCreds(result));
    }, (err) => {
      dispatch(_setStudentCreds(null, err));
    })
    .finally(() => {running.loginStudent = null;});
};

