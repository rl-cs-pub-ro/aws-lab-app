export const ADMIN_UPDATE_AUTH = "ADMIN_UPDATE_AUTH";
export const GET_STUDENT_USERS = 'ADMIN_GET_STUDENT_USERS';
export const GET_STUDENT_RESOURCES = 'ADMIN_GET_STUDENT_RESOURCES';
export const CLEANUP_USER = 'ADMIN_CLEANUP_USER';
export const CLEANUP_ALL_USERS = 'ADMIN_CLEANUP_ALL_USERS';

export const loginAdmin = (username, password) => (dispatch) => {
  let authToken = null;
  let authFailed = '';

  if (username == "admin" && password == "123") {
    authToken = "asddf";
  } else {
    authFailed = "invalid username or password!";
  }
  
  setTimeout(() => {
    dispatch({
      type: ADMIN_UPDATE_AUTH,
      authToken: authToken,
      authFailed: authFailed
    });
  }, 1000);
};

export const logoutAdmin = () => {
  return {
    type: ADMIN_UPDATE_AUTH,
    authToken: null
  };
};

export const getStudentUsers = () => (dispatch) => {
  const products = [].reduce((obj, product) => {
    obj[product.id] = product;
    return obj;
  }, {});

  dispatch({
    type: GET_PRODUCTS,
    products
  });
};

