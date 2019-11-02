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
  actionResults: {},
};


// returns the normalized results of an action
let normalizeActionRes = (actionRes) => {
  return {
    loading: !!(actionRes && actionRes.loading),
    success: !!(actionRes && actionRes.success),
    error: (actionRes && actionRes.error ? actionRes.error : ''),
  };
};


const adminReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ADMIN_UPDATE_AUTH:
      return {
        ...state,
        authStatus: action.authStatus,
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
      let actionResults = {...state.actionResults};
      actionResults[action.name] = normalizeActionRes(action.results);
      return {
        ...state,
        actionResults
      };
    default:
      return state;
  }
};

export default adminReducer;
