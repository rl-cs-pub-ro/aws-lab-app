export const UPDATE_PAGE = 'UPDATE_PAGE';
export const UPDATE_OFFLINE = 'UPDATE_OFFLINE';
export const APP_ERROR = 'APP_ERROR';

const PAGES = {
  "student": {
    title: "Student",
  },
  "admin": {
    title: "Admin", requiresLogin: true,
    subpages: {
      "index": "Dashboard",
      "users": "Users",
      "resdources": "AWS Resources",
    }
  },
  "error404": {
    title: "Error 404",
  }
};
const DEFAULT_PAGE = 'student';

export const navigate = (path) => (dispatch) => {
  // Extract the page name from path.
  const page = path === '/' ? DEFAULT_PAGE : path.slice(1);
  dispatch(loadPage(page));
};

const loadPage = (page) => (dispatch) => {
  let pageObj = null;
  if (PAGES[page]) {
    pageObj = PAGES[page];
  } else {
    pageObj = PAGES.error404;
    page = 'error404';
  }

  dispatch(updatePage({ ...pageObj, name: page }));
};

const updatePage = (page) => {
  return { type: UPDATE_PAGE, page };
};

export const showAppError = (err) => {
  return { type: APP_ERROR, error: err };
};

export const updateOffline = (offline) => (dispatch, getState) => {
  // Show the snackbar only if offline status changes.
  //if (offline !== getState().app.offline) {
  //  dispatch(showSnackbar());
  //}
  dispatch({
    type: UPDATE_OFFLINE,
    offline
  });
};

export const updateLayout = (wide) => (dispatch, getState) => {
  console.log(`The window changed to a ${wide ? 'wide' : 'narrow'} layout`);
};

