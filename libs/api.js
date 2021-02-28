'use strict';
const request   = require('request'),
      config    = require('../config'),
      assert    = require('assert'),
      util      = require('util'),
      logger    = require('./logger'),
      _         = require('lodash'),


      INVESTOR_ID = 'XXXXXXXXXX',
      VERSION = 'v1',
      AUTHORIZATION = 'XXXXXXXXXX',

      CASH_URL = 'https://api.lendingclub.com/api/investor/%s/accounts/%s/availablecash',
      LOANS_URL = 'https://api.lendingclub.com/api/investor/%s/loans/listing',
      PORTFOLIO_URL = 'https://api.lendingclub.com/api/investor/%s/accounts/%s/portfolios',
      SUMBIT_ORDER_URL = 'https://api.lendingclub.com/api/investor/%s/accounts/%s/orders',

      CASH_PATH = 'availableCash',
      LOANS_PATH = 'loans',
      ORDER_PATH = 'orderConfirmations',

      BASE_OPTS = {
        timeout: config.timeout,
        headers: {
          Authorization: AUTHORIZATION
        },
        json: true
      },

      CASH_OPTS  = _.extend(_.cloneDeep(BASE_OPTS),
                                {
                                  method: 'GET',
                                  url: util.format(CASH_URL, VERSION, INVESTOR_ID)
                                }),
      LOANS_OPTS = _.extend(_.cloneDeep(BASE_OPTS),
                                {
                                  method: 'GET',
                                  url: util.format(LOANS_URL, VERSION),
                                  qs: {showAll: false},
                                  headers: {
                                    'X-LC-LISTING-VERSION': '1.3',
                                    'Authorization': AUTHORIZATION
                                  }
                                }),
      ORDER_OPTS = _.extend(_.cloneDeep(BASE_OPTS),
                                {
                                  method: 'POST',
                                  url: util.format(SUMBIT_ORDER_URL, VERSION, INVESTOR_ID),
                                  headers: {
                                    'Authorization': AUTHORIZATION
                                  }
                                });

/**
 * @param object arguments
 * @return boolean
 */
function fail(args) {
    return !!args[0] || args[1].statusCode !== 200;
}

/**
 * @param object arguments
 * @return error
 */
function cause(args) {
    if (args[0]) {
        return args[0];
    }
    return new Error('statusCode=' + args[1].statusCode);
}

/**
 * @param params object
 * @param callback function
 * @return json
 */
function callAPI(params, callback) {
  var opts;
  assert(params.opts instanceof Object);
  assert(typeof params.path === 'string');
  assert(typeof callback === 'function');

  if (params.payload) {
    opts = _.cloneDeep(params.opts);
    assert(params.payload instanceof Object);
    opts.json = params.payload;
  }
  else {
    opts = params.opts;
  }

  logger.profile('latency');
  request(opts, (err, resp) => {
    logger.profile('latency');
    if (fail([err, resp])) {
      return callback(cause([err, resp]));
    }
    callback(null, _.get(resp.body, params.path, params.ifServerInvalid));
  });
}

/**
 * @param callback function
 * @return [error, Number]
 */
function getAvailableCash(callback) {
  logger.log('info', 'Getting available cash');
  callAPI({opts: CASH_OPTS, path: CASH_PATH, ifServerInvalid: 0}, callback);
}

/**
 * @param callback function
 * @return [error, json]
 */
function getAvailableLoans(callback) {
  logger.log('info', 'Getting available loans');
  callAPI({opts: LOANS_OPTS, path: LOANS_PATH, ifServerInvalid: []}, callback);
}

/**
 * @param order object
 * @param callback function
 * @return [error, json]
 */
function placeOrder(order, callback) {
  logger.log('info', 'Placing order');
  callAPI({opts: ORDER_OPTS, path: ORDER_PATH, payload: order}, callback);
}

module.exports.getAvailableCash = getAvailableCash;
module.exports.getAvailableLoans = getAvailableLoans;
module.exports.placeOrder = placeOrder;
