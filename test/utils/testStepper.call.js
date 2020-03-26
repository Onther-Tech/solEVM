'use strict';

const HydratedRuntime = require('./../../utils/HydratedRuntime');
const Merkelizer = require('../../utils/Merkelizer');
const OP = require('../../utils/constants');
const debug = require('debug')('dispute-test');
const web3 = require('web3');

const code = '6080604052600436106100505760003560e01c63ffffffff168063141f32ff146100555780632e52d606146100a257806367e404ce146100cd5780639b58bc2614610124578063eea4c86414610171575b600080fd5b34801561006157600080fd5b506100a0600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506101be565b005b3480156100ae57600080fd5b506100b7610242565b6040518082815260200191505060405180910390f35b3480156100d957600080fd5b506100e2610248565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b34801561013057600080fd5b5061016f600480360381019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061026e565b005b34801561017d57600080fd5b506101bc600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506102f0565b005b8173ffffffffffffffffffffffffffffffffffffffff1660405180807f7365744e2875696e743235362900000000000000000000000000000000000000815250600d019050604051809103902060e01c826040518263ffffffff1660e01b8152600401808281526020019150506000604051808303816000875af292505050505050565b60005481565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b8173ffffffffffffffffffffffffffffffffffffffff1660405180807f7365744e2875696e743235362900000000000000000000000000000000000000815250600d019050604051809103902060e01c826040518263ffffffff1660e01b815260040180828152602001915050600060405180830381865af492505050505050565b8173ffffffffffffffffffffffffffffffffffffffff1660405180807f7365744e2875696e743235362900000000000000000000000000000000000000815250600d019050604051809103902060e01c826040518263ffffffff1660e01b8152600401808281526020019150506000604051808303816000875af1925050505050505600a165627a7a72305820ef6419e53bb5b6911db1b3e53234cb7ec9e96849b62583cdcb667d933794ea860029';
const data = '0xeea4c8640000000000000000000000000dcd2f752394c41875e259e00bb44fd505297caf000000000000000000000000000000000000000000000000000000000000000a';

// need to init tStorage
const tStorage = ['0xaf63dba574b8df870564c0cfef95996d0bf09a9de28de1e31994eb090e8e7737',
'0x00000000000000000000000000000000000000000000000000000000000003e8',
'0x0000000000000000000000000000000000000000000000000000000000000002',
'0x00000000000000000000000000000000000000000000000000000000000003e8'];

// callee
const calleeCode = '60806040526004361061003a5760003560e01c63ffffffff1680632e52d6061461003f5780633f7a02701461006a57806367e404ce14610097575b600080fd5b34801561004b57600080fd5b506100546100ee565b6040518082815260200191505060405180910390f35b34801561007657600080fd5b50610095600480360381019080803590602001909291905050506100f4565b005b3480156100a357600080fd5b506100ac61013f565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b60005481565b8060008190555033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16815600a165627a7a72305820ddf354dc0fcd94154cc016ca4d2e081eaa3daaac1eba7a22e78ce74598aaef520029';
const calleeTstorage = ['0xaf63dba574b8df870564c0cfef95996d0bf09a9de28de1e31994eb090e8e7737',
'0x00000000000000000000000000000000000000000000000000000000000003e8',
'0x0000000000000000000000000000000000000000000000000000000000000002',
'0x00000000000000000000000000000000000000000000000000000000000003e8']; 

const accounts = [
    {
      address: 'bBF289D846208c16EDc8474705C748aff07732dB',
      code: code,
      tStorage: tStorage,
      nonce: 0,
      balance: 10,
      storageRoot: OP.ZERO_HASH,
      codeHash: OP.ZERO_HASH
    },
    // callee
    {
        address: '0dcd2f752394c41875e259e00bb44fd505297caf',
        code: calleeCode,
        tStorage: calleeTstorage,
        nonce: 0,
        balance: 10,
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
      // console.log('calldepth 0', steps[i].stateRoot)
        if (steps[i].opCodeName === 'CALL') {
          // console.log('CALL!')
          const calleeSteps = steps[i].calleeSteps;
          const len = calleeSteps.length;
          for (let i = 0; i < len; i++){
            if (calleeSteps[i].opCodeName === 'SSTORE') {
              // console.log('calldepth 1', calleeSteps[i-1], calleeSteps[i])
            }
           
           
          }
        
        }
    }

    // console.log(steps[138])
      
    merkle = await new Merkelizer().run(steps, code, data, tStorage);
    // console.log(merkle.printLeave());
})();