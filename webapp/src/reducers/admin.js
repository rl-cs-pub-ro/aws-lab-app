import {
  ADMIN_UPDATE_AUTH, ADMIN_UPDATE_USERS, ADMIN_UPDATE_ACTION
} from '../actions/admin.js';

const INITIAL_STATE = {
  authStatus: false,
  authError: '',
  authLoaded: false,
  users: {},
  actionStatus: {},
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
    case ADMIN_UPDATE_USERS:
      return {
        ...state,
        users: action.users,
      };
    case ADMIN_UPDATE_ACTION:
      let actionStatus = {...state.actionStatus};
      actionStatus[action.name] = action.status;
      return {
        ...state,
        actionStatus
      };
    default:
      return state;
  }
};

export default adminReducer;
