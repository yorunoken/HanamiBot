const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("database.sqlite");

/**
 * @typedef {('get' | 'run')} QueryType
 * @typedef {('value' | 'file')} QueryJSON
 */

/**
 * Performs a query based on the provided parameters.
 * @param {Object} options - The query options.
 * @param {string} options.query - The query string.
 * @param {Object} options.parameters - The query parameters.
 * @param {QueryType} options.type - The type of query. Can be 'get' or 'run'.
 * @param {QueryJSON} options.name - The type of JSON name. Can be 'value' or 'file'.
 * @returns {Promise} - A promise that resolves with the query result.
 */
async function query({ query, parameters, type, name }) {
  return new Promise((resolve, reject) => {
    const callback = (err, res) => {
      if (type === "run") {
        resolve("done");
      }
      if (res) {
        if (name == "value") {
          res = JSON.parse(res.value);
          resolve(res);
        } else {
          resolve(res.file);
        }
      } else {
        resolve(null);
      }
      reject(err);
    };

    if (parameters) {
      return db[type](query, parameters, callback);
    }
    return db[type](query, callback);
  });
}
module.exports = {
  query,
};
