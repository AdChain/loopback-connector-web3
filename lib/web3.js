'use strict';

var debug = require('debug')('loopback:connector:web3');
var Web3 = require('web3');
var solc = require('solc');
var fs = require('fs');
var Web3DAO = require('./dao');

var web3 = new Web3();
var account;
var contracts = {};

function Web3(settings) {
  this.name = 'Web3';
  // if (web3.eth.accounts[0]) {
  //   account = web3.eth.accounts[0];
  //   debug('setting rpc ' + settings.name + ' @ ' + settings.url);
  //   web3.setProvider(new web3.providers.HttpProvider(settings.url));
  // } else {
  //   throw "error : can not connect to rpc server - please check datasources.json"
  // }
}

Web3.prototype.DataAccessObject = Web3DAO;

Web3.prototype.define = function(modelData) {
  var model = modelData.model;
  web3.setProvider(new web3.providers.HttpProvider(modelData.settings.ethereum.url));
  if (web3.eth.accounts[0]) {
    account = web3.eth.accounts[0];    
  } else {
    throw "error : can not connect to rpc server - please check datasources.json"
  }

  // all models must have an ID property, and we want this model to have a String ID property
  model.defineProperty('id', {type: String, id: true});

  var contractSettings = modelData.settings.ethereum.contract;
  var contractStr = getSolSourceFile(modelData.settings.ethereum.contract.sol);
  var compiledContract = compileSolSourceFile(contractStr);
  var abi = getAbi(compiledContract, contractSettings.name);
  var bytecode = getBytecode(compiledContract, contractSettings.name);
  var Contract = web3.eth.contract(abi);
  var gas = modelData.settings.ethereum.gas;

  if (contractSettings.params !== undefined) {
    contractSettings.params.map(function (param){
      switch (param.type) {
        case "string":
          model.defineProperty("params", {type: String, id: false});
          break;
        case "integer":
          model.defineProperty("params", {type: Number, id: false});
          break;
        case "boolean":
          model.defineProperty("params", {type: Boolean, id: false});
          break;
      }
    });
  }
  
  model.construct = function(data, cb) {
    var params = data['params'] || null;
    var contract = Contract.new(params, {
      from: account,
      data: bytecode.toString(),
      gas: gas
      }, function (e, contractInstance){
        if (e !== null) {
          cb && cb(null, {error:e.toString()})
        } else {
          if (typeof contractInstance.address !== 'undefined') {
            debug('Contract mined! address: ' + contractInstance.address + ' transactionHash: ' + contractInstance.transactionHash);
            cb && cb(null, {id:contractInstance.address})
            contracts[contractInstance.address] = contractInstance;
          }
        }
    })
  }

  defineMethods(model, abi);

  setRemoting(model.construct, {
    description: 'Create a new contract instance',
    accepts: {arg: 'data', type: 'object', http: {source: 'body'}},
    returns: {arg: 'results', type: 'object', root: true},
    http: {verb: 'post', 'path': '/'},
  });
}

function getSolSourceFile(fileName) {
  return fs.readFileSync(fileName, {encoding: 'utf-8'});
}

function compileSolSourceFile(sourceStr) {
  return solc.compile(sourceStr, 1);
}

function getAbi(compiledContract, contractName) {
  return JSON.parse(compiledContract.contracts[contractName].interface);
}

function getBytecode(compiledContract, contractName) {
  return compiledContract.contracts[contractName].bytecode
}

function defineMethods(model, abi) {
  abi.map(function(obj){
    if (obj.constant === false && obj.type === "function") {
      model.prototype[obj.name] = function(data, cb) {
        var address = this.id.toString(16);
        var params = obj.inputs.map(function(input) {
          return data[input.name];
        })
        var contractInstance = contracts[address];
        web3.eth.defaultAccount = web3.eth.accounts[0];
        var result = contractInstance[obj.name](params.toString(), function(err, result){
          cb && cb(null, {"txhash":result})  
        });
      }
      model.remoteMethod(obj.name, {
        description: 'Call the ' + obj.name + ' contract method',
        accepts: {arg: 'data', type: Number, http: {source: 'body'}},
        returns : {args: 'results', type: 'object', root: true},
        http: {verb: 'post', 'path': '/' + obj.name},
        isStatic: false
      })
    }
  })
}

function setRemoting(fn, options) {
  options = options || {};
  for (var opt in options) {
    if (options.hasOwnProperty(opt)) {
      fn[opt] = options[opt];
    }
  }
  fn.shared = true;
}

module.exports = Web3;