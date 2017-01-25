
# Ethereum Web3 LoopBack connector :+1:

The web3 connector is still early alpha - DO NOT USE IN PRODUCTION. :shipit:

## Configuration

datasources.json :

```  
...
"ethereum": {
    "name": "ethereum",
    "connector": "web3",
    "url":<optional>
  },
...  
```
If you do NOT specify a RPC URL, the connector will assume "http://localhost:8545". Don't want to run your own node? Check out [Infura](https://www.infura.io/)!

Now just create a model that represents your Solidity based smart contract, for example
```
{
  "name": "Contract",
  "plural": "contracts",
  "base": "Model",
  "idInjection": true,
  "options": {
    "validateUpsert": true
  },
  "properties": {},
  "validations": [],
  "relations": {},
  "acls": [],
  "methods": {},
  "ethereum":{
    "contract":{
      "sol": "server/SimpleStorage.sol",
      "name":"SimpleStorage"
    },
    "gas": 3000000
  }
}
```

where "SimpleStorage" (above) is the name of the constructor for the smart contract. The connector will compile the contract and doing a ```POST``` at the model base route will deploy the contract and return the contract address.

## Example :point_left:
For an example to get you up and running, checkout the [web3 demo](https://github.com/AdChain/web3-demo). 

## Dapps :raised_hands:
* [Tic-Tac-Toe](https://github.com/AdChain/tictactoe-loopback)
* Vidbit (private beta, tweet me to get on the list [@jamesyoung](https://twitter.com/jamesyoung/))

## The future :rocket:
* [Metamask](https://metamask.io/)
* [uPort](https://www.uport.me/)
* [Infura](https://www.infura.io/)

## Keep in touch :wave::wave::wave:

If you are building a decentralized application using the web3 connector, tweet me : [@jamesyoung](https://twitter.com/jamesyoung/) and I'll add you to the list of dapps.