'use strict';

const config = require('../config'),
      logger = require('./logger'),
      assert = require('assert'),
      errors = require('./errors'),
      moment = require('moment-timezone'),
      _      = require('lodash'),

      /* It takes mean 10.5ms for packets to travel from San Francisco
       * to Nevada 1.8sd. We want the packet to arrive as soon after the 
       * hour mark as possible but 2sd chance not before.
       */
      PING_TIME = 7;

function getNextHourTZ(now) {
  var hourInPacificTime = moment.tz(now, config.lcTimezone).hour(), i;
  if (hourInPacificTime >= _.max(config.newLoanHoursPacificTime)) {
    throw new Error('no more hours');
  }
  return _.min(_.reject(config.newLoanHoursPacificTime, (hour) =>
                                { return hour <= hourInPacificTime }));
}

function waitUntilExactTimeTZ(callback) {
  var now = moment(), nextHourLCTZ, buyTimeUnixMs;
  try {
    nextHourLCTZ = getNextHourTZ(now)
  } catch (err) {
    return callback(err);
  }

  buyTimeUnixMs = moment.tz({d: now.date(), h: nextHourLCTZ, m:0, s:0, ms: 0}, config.lcTimezone).valueOf();
  logger.log('info', 'Wait until ' + buyTimeUnixMs + '. Next LC time=' + nextHourLCTZ);
  while (Date.now() < buyTimeUnixMs - PING_TIME) {}
  callback(null);
}

function pickBuyableSubset(params) {
  return _.take(_.orderBy(params.availableLoans, 'intRate', 'desc'), params.buyingPower);
}

function convertLoansToOrder(loans, callback) {
  var order;
  assert(loans instanceof Array);
  if (_.isEmpty(loans)) {
    return callback(new errors.NoQualifiedLoansError);
  }

  order = {
    aid: config.aid,
    orders: loans.map((loan) => {
              return {
                loanId: loan.id,
                requestedAmount: config.minimumLoanAmount,
                portfolioId: config.portfolioId
              }
            })
  };
  logger.log('info', 'Created order', order.orders);
  logger.log('info', 'Size of order=' + order.orders.length);
  callback(null, order);
}

function handleError(error) {
  if (error instanceof errors.InsufficientFundsError) {
    logger.log('warn', 'Insufficent funds', '$' + error.message);
  }
  else if (error instanceof errors.NoAvailableLoansError) {
    logger.log('warn', 'No new loans from Lending Club');
  }
  else if (error instanceof errors.NoQualifiedLoansError) {
    logger.log('warn', 'No qualified loans');
  }
  else {
    logger.log('error', error)
  }
}

module.exports.pickBuyableSubset = pickBuyableSubset;
module.exports.waitUntilExactTimeTZ = waitUntilExactTimeTZ;
module.exports.convertLoansToOrder = convertLoansToOrder;
module.exports.handleError = handleError;
