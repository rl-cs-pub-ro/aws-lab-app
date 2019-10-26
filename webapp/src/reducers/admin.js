import { ADMIN_UPDATE_AUTH } from '../actions/admin.js';

const INITIAL_STATE = {
  authStatus: false,
  authError: '',
  authLoaded: false,
};


const adminReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ADMIN_UPDATE_AUTH:
      return {
        ...state,
        authStatus: action.authStatus,
        authError: action.authError,
        authLoaded: true,
      };
    default:
      return state;
  }
};

export default adminReducer;
