"use strict";

const lcApi  = require('./libs/api'),
      logic  = require('./libs/logic'),
      logger = require('./libs/logger'),
      utils  = require('./libs/utils'),
      errors = require('./libs/errors'),
      config = require('./config'),
      async  = require('async'),
      _      = require('lodash'),

      dnscache = require('dnscache')({
        "enable" : true,
        "ttl" : config.dnsCacheTTL,
        "cachesize" : 20
      });

function realRun() {
  return process.argv[2] === config.realFlag || process.argv[3] === config.realFlag;
}

function skipWait() {
  return process.argv[2] === config.skipWait || process.argv[3] === config.skipWait;
}

async.waterfall([
  function (next) {
    lcApi.getAvailableCash(next);
  },
  function (cash, next) {
    logic.getBuyingPower(cash, next);
  },
  function (buyingPower, next) {
    if (skipWait()) {
      logger.log('debug', 'Skipping wait time');
      return next(null, buyingPower);
    }
    if (realRun()) {
      utils.waitUntilExactTimeTZ((err) => {
        next(err, buyingPower);
      });
    }
    else {
      logger.log('debug', 'Skipping wait time');
      next(null, buyingPower);
    }
  },
  function (buyingPower, next) {
    lcApi.getAvailableLoans((err, loans) => {
      if (_.isEmpty(loans)) {
        return next(new errors.NoAvailableLoansError);
      }
      next(err, buyingPower, loans);
    });
  },
  function (buyingPower, loans, next) {
    next(null, buyingPower, logic.filterLoans(loans));
  },
  function (buyingPower, loans, next) {
    next(null, utils.pickBuyableSubset({availableLoans: loans,
                                        buyingPower: buyingPower}));
  },
  function (loans, next) {
    utils.convertLoansToOrder(loans, next);
  },
  function (order, next) {
    if (realRun()) {
      lcApi.placeOrder(order, next);
    }
    else {
      logger.log('debug', 'Not placing order');
      next(null)
    }
  }
], (err, result) => {
  if (err) {
    utils.handleError(err);
  }
  else {
    logger.log('info', 'ORDER RESULT', result);
  }
});
