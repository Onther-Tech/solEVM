'use strict';

const HydratedRuntime = require('./../../utils/HydratedRuntime');
const Merkelizer = require('../../utils/Merkelizer');
const OP = require('../../utils/constants');
const debug = require('debug')('dispute-test');
const utils = require('ethereumjs-util');
const web3 = require('web3');

const code = '6080604052600436106100295760003560e01c806323188b771461002e5780637a8b01141461007f575b600080fd5b34801561003a57600080fd5b5061007d6004803603602081101561005157600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506100c1565b005b6100ab6004803603602081101561009557600080fd5b8101908080359060200190929190505050610104565b6040518082815260200191505060405180910390f35b806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b600060018081905550600060405180807f736574412875696e743235362900000000000000000000000000000000000000815250600d01905060405180910390209050604051818152836004820152602081602483600a600054617530f1600081141561017057600080fd5b815193506024820160405250505091905056fea265627a7a72315820d8cb695b045af7e9e731dfba4fd6dbb1008deb7e88af9587df21de4d69885c3364736f6c63430005100032';
const data = '0x7a8b0114000000000000000000000000000000000000000000000000000000000000000a';
const tStorage = [
  '0x0000000000000000000000000000000000000000000000000000000000000000',
  '0x0000000000000000000000009876e235a87f520c827317a8987c9e1fde804485',
];

// callee
const calleeCode = '6080604052600436106100345760003560e01c80632e52d606146100365780633f7a02701461006157806367e404ce1461008f575b005b34801561004257600080fd5b5061004b6100e6565b6040518082815260200191505060405180910390f35b61008d6004803603602081101561007757600080fd5b81019080803590602001909291905050506100ec565b005b34801561009b57600080fd5b506100a4610137565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b60005481565b8060008190555033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff168156fea265627a7a72315820885744b366a97f0b4ceff0f7f099f844798336cbf8dfe92321859d30cc6f1ab964736f6c63430005100032';
const calleeTstorage = [];
 
const accounts = [
    {
      address: OP.DEFAULT_CONTRACT_ADDRESS,
      code: code,
      tStorage: tStorage,
      nonce: 0,
      balance: 100,
      storageRoot: OP.ZERO_HASH,
      codeHash: OP.ZERO_HASH
    },
    // callee
    {
      address: '9876e235a87F520c827317a8987C9E1FDe804485',
      code: calleeCode,
      tStorage: calleeTstorage,
      nonce: 0,
      balance: 100,
      storageRoot: OP.ZERO_HASH,
      codeHash: OP.ZERO_HASH
    }
];

let steps;
let copy;
let merkle;
const runtime = new HydratedRuntime();

(async function(){
    steps = await runtime.run({ accounts, code, data, tStorage: tStorage, pc: 0 });
    
    for (let i = 0; i < steps.length; i++){
      console.log(web3.utils.soliditySha3(steps[i].callerAccount.addr.toString('hex')));
      console.log(web3.utils.soliditySha3(steps[i].calleeAccount.addr.toString('hex')));
      if (steps[i].opCodeName === 'CALL') {
        console.log('CALL')
        // console.log(steps[i-1].callerAccount.rlpVal.toString('hex'));
        // console.log(steps[i-1].calleeAccount.rlpVal.toString('hex'));
        
        const calleeSteps = steps[i].calleeSteps;
        const len = calleeSteps.length;
              
      for (let i = 0; i < len; i++){
         
      }
   } 
  }
   
    merkle = await new Merkelizer().run(steps, code, data, tStorage);
    // console.log(merkle.printLeave());
   
})();