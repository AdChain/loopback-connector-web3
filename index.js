'use strict';

var Web3 = require('./lib/web3');

exports.initialize = function(dataSource, cb) {
  var settings = dataSource.settings;
  var connector = new Web3(settings);
  dataSource.connector = connector;
};
