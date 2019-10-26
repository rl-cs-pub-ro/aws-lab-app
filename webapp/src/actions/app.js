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
      "resources": "AWS Resources",
    }
  },
  "error404": {
    title: "Error 404",
  }
};
const DEFAULT_PAGE = 'student';

export const navigate = (path) => (dispatch) => {
  // Extract the page name from path.
  const segments = path.split("/").filter((val) => (!!val));
  const page = (segments.length == 0 ? DEFAULT_PAGE : segments[0]);
  console.log("PATH", path, segments, page);
  dispatch(loadPage(page, segments.slice(1)));
};

const loadPage = (page, pageComponents) => (dispatch) => {
  console.log("LOAD", page, pageComponents);
  let pageDescriptor = PAGES[page];
  if (!pageDescriptor) {
    page = 'error404';
    pageDescriptor = PAGES[page];
  }
  let pageObj = { name: page, title: pageDescriptor.title };
  if (pageComponents && pageComponents.length) {
    let subpage = pageComponents[0];
    if (pageDescriptor.subpages && pageDescriptor.subpages[subpage]) {
      pageObj.subpage = { ...pageDescriptor.subpages[subpage], name: subpage };
    } else {
      pageObj = { name: 'error404', title: PAGES.error404.title };
    }
  }
  dispatch(updatePage(pageObj));
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

