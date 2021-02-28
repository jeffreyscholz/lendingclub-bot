'use strict';

const config = require('../config.json'),
      errors = require('./errors'),
      logger = require('./logger'),
      assert = require('assert'),
      _      = require('lodash'),

      SEVEN_YEARS = 7 * 12,
      TWO_YEARS = 2 * 12;

function getBuyingPower(availableCash, callback) {
  var buyingPower;
  assert(typeof availableCash === 'number');

  if (availableCash <= config.minimumLoanAmount) {
    return callback(new errors.InsufficientFundsError(availableCash));
  }

  buyingPower = Math.floor(availableCash / config.minimumLoanAmount);
  logger.log('info', 'Buying power: ' + buyingPower);

  callback(null, buyingPower);
}

/**
 * Whenever doing inequality checks, check the type first since JS is
 * unpredictable when types are wrong.
 */
function isValidLoan(loan) {
  return (loan.grade === 'D' || loan.grade === 'E' || loan.grade === 'F' || loan.grade === 'G') &&
         (loan.homeOwnership === 'OWN' || loan.homeOwnership === 'MORTGAGE') &&
         (typeof loan.annualInc === 'number' && loan.annualInc >= 48000) &&
         //(typeof loan.empLength === 'number' && loan.empLength >= TWO_YEARS) &&
         (typeof loan.addrState === 'string' && loan.addrState !== 'FL') &&
         (loan.inqLast6Mths === 0) &&
         (loan.purpose === 'debt_consolidation' || loan.purpose === 'credit_card' || loan.purpose === 'home_improvement') &&
	 true;
         //(typeof loan.revolUtil === 'number' && typeof loan.loanAmount === 'number' && loan.revolBal * 1.06 >= loan.loanAmount);
}

function filterLoans(availableLoans) {
  assert(availableLoans instanceof Array);
  logger.log('info', "Inspecting " + availableLoans.length + " loans.")
  return availableLoans.filter(isValidLoan);
}

module.exports.getBuyingPower = getBuyingPower;
module.exports.filterLoans = filterLoans;
