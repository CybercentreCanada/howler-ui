// @ts-check

/* eslint-disable @typescript-eslint/naming-convention */
const fs = require('fs');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const lodash = require('lodash');

/** @type {'MOCK' | 'REST'} */
// @ts-ignore
const API = import.meta.env.REACT_APP_API;

/** @type {(store?: {[index: string]: {[method: string]: any}}, dir?: string, isDataDir?: boolean) => {[index: string]: {[method: string]: any}}} */
const getResponseMap = (store = {}, dir = 'src/api', isDataDir = false) => {
  const files = fs.readdirSync(dir);
  const uri = /src\/api(\/.*)/.exec(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const fileStat = fs.lstatSync(filePath);

    if (isDataDir) {
      const key = path.join(uri[1].replace('data', ''), file.replace('index', '').replace('.json', ''));
      store[key.endsWith('/') ? key : `${key}/`] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } else if (fileStat.isDirectory()) {
      getResponseMap(store, filePath, file === 'data');
    }
  });

  return store;
};

const createMockApi = app => {
  console.log('Building response map');
  const responses = getResponseMap();

  console.log('Registering routes');
  Object.keys(responses)
    .sort((a, b) => {
      if (a.includes(':') && b.includes(':')) {
        return a.localeCompare(b);
      } else if (a.includes(':')) {
        return 1;
      } else if (b.includes(':')) {
        return -1;
      } else {
        return a.localeCompare(b);
      }
    })
    .forEach(route => {
      const url = path.join(`/api/v1/${route}`);
      const response = responses[route];

      Object.keys(response).forEach(method => {
        const paramMatch = /^[^:]*:([^:/]*)[^:]*$/.exec(url);
        const param = paramMatch && paramMatch[1];

        console.log(`Registering [${method}] ${url}`);

        app[method.toLowerCase()](url, (req, res) => {
          console.log(`[${method}] ${req.url}`);

          let data = response[method];
          const paramValue = param && req.params[param];
          if (paramValue) {
            if (lodash.isArray(data)) {
              data = data.find(i => lodash.get(i, param.replace('_', '.')) === paramValue);
            } else {
              data = data[paramValue];
            }

            if (data) {
              res.json({ api_status_code: 200, api_response: data });
            } else {
              res.sendStatus(404);
            }
          } else if (data.code && req.query.code) {
            // Special case for login with code params
            res.json({ api_status_code: 200, api_response: data.code });
          } else if (data.redirect) {
            res.redirect(data.redirect);
          } else {
            res.json({ api_status_code: 200, api_response: data });
          }
        });
      });
    });
};

module.exports = function (app) {
  if (API === 'MOCK') {
    try {
      createMockApi(app);
    } catch (e) {
      console.error(e);
    }
  } else {
    app.use(
      '/api',
      createProxyMiddleware({
        target: 'http://localhost:5000',
        changeOrigin: true
      })
    );
  }
};
