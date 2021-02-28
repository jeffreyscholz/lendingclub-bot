'use strict';

const util = require ('util');

function InsufficientFundsError(message) {
  Error.call(this);
  this.message = message;
}
util.inherits(InsufficientFundsError, Error);

function NoAvailableLoansError(message) {
  Error.call(this);
  this.message = "No Available Loans";
}
util.inherits(NoAvailableLoansError, Error);

function NoQualifiedLoansError(message) {
  Error.call(this);
  this.message = "No Qualified Loans";
}
util.inherits(NoQualifiedLoansError, Error);

module.exports = {
  InsufficientFundsError: InsufficientFundsError,
  NoAvailableLoansError: NoAvailableLoansError,
  NoQualifiedLoansError: NoQualifiedLoansError
}
