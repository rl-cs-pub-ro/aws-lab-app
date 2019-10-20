import { STUDENT_UPDATE } from '../actions/student.js';

const INITIAL_STATE = {
  credentials: null,
  authFailed: '',
};

const studentReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case STUDENT_UPDATE:
      return {
        credentials: action.studentCreds,
        authFailed: action.studentAuthFailed
      };
    default:
      return state;
  }
};

export default studentReducer;
