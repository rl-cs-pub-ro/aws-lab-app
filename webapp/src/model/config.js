// load the API config

import 'superagent/dist/superagent.js';

let apiConfig = null;


export const loadConfig = () => {
  if (apiConfig !== null) {
    return Promise.resolve(apiConfig);
  }
  return superagent.get("/apiConfig.json")
    .timeout(5000)
    .accept('json')
    .then((resp) => {
      apiConfig = resp.body;
      return apiConfig;
    }, (err) => {
      // default to the same host / port
      apiConfig = {"apiURL": ""};
      return apiConfig;
    });
};

