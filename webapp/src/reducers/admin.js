import {
  ADMIN_UPDATE_AUTH, ADMIN_UPDATE_LAB, ADMIN_UPDATE_AWS, ADMIN_UPDATE_ACTION,
} from '../actions/admin.js';

const INITIAL_STATE = {
  authStatus: false,
  authError: '',
  authLoaded: false,
  users: {},
  stats: {},
  lab: {},
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
    case ADMIN_UPDATE_LAB:
      return {
        ...state,
        lab: action.lab,
      };
    case ADMIN_UPDATE_AWS:
      let usersMap = action.data.users.reduce((obj, user) => {
        obj[user.username] = user;
        return obj;
      }, {});
      return {
        ...state,
        users: usersMap,
        stats: action.data.stats,
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
