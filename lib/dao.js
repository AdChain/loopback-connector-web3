'use strict';

function Web3DAO() {};

Web3DAO.findById = function(id, arg2, arg3, cb) {
  var Model = this;
  cb(null, new Model({id: id}));
};

module.exports = Web3DAO;
