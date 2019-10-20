export const STUDENT_UPDATE = "STUDENT_LOGIN";

export const loadStudentCredentials = () => (dispatch) => {
  let studentCreds = null;
  // TODO
  dispatch({
    type: STUDENT_UPDATE,
    studentCreds,
    studentAuthFailed: ''
  });
};

export const loginStudent = (labPassword) => (dispatch) => {
  let studentCreds = null;
  let authFailed = '';

  if (labPassword == "123") {
    studentCreds = {
      name: "student1",
      password: "TEST3210"
    };

  } else {
    authFailed = "invalid lab password";
  }

  dispatch({
    type: STUDENT_UPDATE,
    studentCreds: studentCreds,
    studentAuthFailed: authFailed
  });
};

