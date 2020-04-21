'use strict';

const HydratedRuntime = require('./../../utils/HydratedRuntime');
const Merkelizer = require('../../utils/Merkelizer');
const OP = require('../../utils/constants');
const utils = require('ethereumjs-util');
const BN = utils.BN;
const debug = require('debug')('dispute-test');
const web3 = require('web3');

const code = '608060405234801561001057600080fd5b506004361061004c5760003560e01c80632e52d606146100515780633f7a02701461006f57806367e404ce1461009d5780638be90481146100e7575b600080fd5b610059610115565b6040518082815260200191505060405180910390f35b61009b6004803603602081101561008557600080fd5b810190808035906020019092919050505061011b565b005b6100a5610166565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b610113600480360360208110156100fd57600080fd5b810190808035906020019092919050505061018c565b005b60005481565b8060008190555033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600060603073ffffffffffffffffffffffffffffffffffffffff1683604051602401808281526020019150506040516020818303038152906040527f3f7a0270000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040518082805190602001908083835b60208310151561026a5780518252602082019150602081019050602083039250610245565b6001836020036101000a0380198251168184511680821785525050505050509050019150506000604051808303816000865af19150503d80600081146102cc576040519150601f19603f3d011682016040523d82523d6000602084013e6102d1565b606091505b509150915050505056fea165627a7a723058200905673953dda40d7b645abf837f1f276d1ea84cd94d74d827bfe558e681e98b0029';
const data = '0x8be90481000000000000000000000000000000000000000000000000000000000000000a';

// need to init tStorage
const tStorage = [];

// callee
const calleeCode = '608060405234801561001057600080fd5b506004361061004c5760003560e01c80632e52d606146100515780633f7a02701461006f57806367e404ce1461009d5780638be90481146100e7575b600080fd5b610059610115565b6040518082815260200191505060405180910390f35b61009b6004803603602081101561008557600080fd5b810190808035906020019092919050505061011b565b005b6100a5610166565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b610113600480360360208110156100fd57600080fd5b810190808035906020019092919050505061018c565b005b60005481565b8060008190555033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600060603073ffffffffffffffffffffffffffffffffffffffff1683604051602401808281526020019150506040516020818303038152906040527f3f7a0270000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040518082805190602001908083835b60208310151561026a5780518252602082019150602081019050602083039250610245565b6001836020036101000a0380198251168184511680821785525050505050509050019150506000604051808303816000865af19150503d80600081146102cc576040519150601f19603f3d011682016040523d82523d6000602084013e6102d1565b606091505b509150915050505056fea165627a7a723058200905673953dda40d7b645abf837f1f276d1ea84cd94d74d827bfe558e681e98b0029';
const calleeTstorage = []; 

const accounts = [
    {
      address: web3.utils.toChecksumAddress('0xcE413edDf0D21983db97B247827973159140CF10'),
      code: code,
      tStorage: tStorage,
      nonce: new BN(0x1, 16),
      balance: new BN(0xa, 16),
      storageRoot: OP.ZERO_HASH,
      codeHash: OP.ZERO_HASH
    },
    // callee
    {
        address: web3.utils.toChecksumAddress('0xcE413edDf0D21983db97B247827973159140CF10'),
        code: calleeCode,
        tStorage: calleeTstorage,
        nonce: new BN(0x1, 16),
        balance: new BN(0xa, 16),
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
    console.log(steps[0].storageRoot.toString('hex'))
    console.log(steps[0].stateRoot.toString('hex'))
    console.log(steps[0].runtimeStackHash.toString('hex'))
    for (let i = 0; i < steps.length; i++){
      // console.log(steps[i].stateRoot.toString('hex'))
        if (steps[i].opCodeName === 'CALL') {
          // console.log('CALL!', i)
          const calleeSteps = steps[i].calleeSteps;
          const len = calleeSteps.length;
          for (let i = 0; i < len; i++){
            // console.log(calleeSteps[i].stateRoot.toString('hex'))
            if (calleeSteps[i].opCodeName === 'SSTORE') {
              // console.log(i)
            }
            if (calleeSteps[i].opCodeName === 'SLOAD') {
              // console.log('l', i)
            }
          }
       
        }
    }
          
    merkle = await new Merkelizer().run(steps, code, data, tStorage);
    // console.log(merkle.printLeave());
})();