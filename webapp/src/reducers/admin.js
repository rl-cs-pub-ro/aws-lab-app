import { ADMIN_UPDATE_AUTH } from '../actions/admin.js';

const INITIAL_STATE = {
  authToken: null,
  authFailed: '',
};

const adminReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ADMIN_UPDATE_AUTH:
      return {
        authToken: action.authToken,
        authFailed: action.authFailed
      };
    default:
      return state;
  }
};

export default adminReducer;
