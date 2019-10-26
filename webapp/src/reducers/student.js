import { STUDENT_UPDATE } from '../actions/student.js';

const INITIAL_STATE = {
  credentials: null,
  loading: true,
  authFailed: '',
};

const studentReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case STUDENT_UPDATE:
      let newData = {
        credentials: action.studentCreds,
        authFailed: action.studentAuthFailed
      };
      if (action.loadingFinished) {
        newData.loading = false;
      }
      return newData;
    default:
      return state;
  }
};

export default studentReducer;
