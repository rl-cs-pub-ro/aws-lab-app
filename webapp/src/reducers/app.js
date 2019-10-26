import {
  UPDATE_PAGE,
  UPDATE_OFFLINE,
  APP_ERROR,
} from '../actions/app.js';

const INITIAL_STATE = {
  page: {},
  adminUser: null,
  offline: false,
};

const appReducer = (state, action) => {
  if (!state) {
    state = INITIAL_STATE;
  }
  switch (action.type) {
    case UPDATE_PAGE:
      return {
        ...state,
        page: action.page
      };
    case UPDATE_OFFLINE:
      return {
        ...state,
        offline: action.offline
      };
    case APP_ERROR:
      return {
        ...state, error_message: action.error
      };
    default:
      return state;
  }
};

export default appReducer;

