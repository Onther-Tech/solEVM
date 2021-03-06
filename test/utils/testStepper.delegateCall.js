'use strict';

const HydratedRuntime = require('./../../utils/HydratedRuntime');
const Merkelizer = require('../../utils/Merkelizer');
const OP = require('../../utils/constants');
const utils = require('ethereumjs-util');
const BN = utils.BN;
const debug = require('debug')('dispute-test');
const web3 = require('web3');

const code = '608060405234801561001057600080fd5b506004361061004c5760003560e01c80632e52d6061461005157806367e404ce1461006f5780639b58bc26146100b9578063eea4c86414610107575b600080fd5b610059610155565b6040518082815260200191505060405180910390f35b61007761015b565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b610105600480360360408110156100cf57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610181565b005b6101536004803603604081101561011d57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506102c7565b005b60005481565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b8173ffffffffffffffffffffffffffffffffffffffff1681604051602401808281526020019150506040516020818303038152906040527f3f7a0270000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040518082805190602001908083835b60208310151561025b5780518252602082019150602081019050602083039250610236565b6001836020036101000a038019825116818451168082178552505050505050905001915050600060405180830381855af49150503d80600081146102bb576040519150601f19603f3d011682016040523d82523d6000602084013e6102c0565b606091505b5050505050565b8173ffffffffffffffffffffffffffffffffffffffff1681604051602401808281526020019150506040516020818303038152906040527f3f7a0270000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040518082805190602001908083835b6020831015156103a1578051825260208201915060208101905060208303925061037c565b6001836020036101000a0380198251168184511680821785525050505050509050019150506000604051808303816000865af19150503d8060008114610403576040519150601f19603f3d011682016040523d82523d6000602084013e610408565b606091505b505050505056fea165627a7a72305820f8022e9b38ca19541db99142eec1a7149412325336836fa30dbe08e703a0d05b0029';
const data = '0x9b58bc26000000000000000000000000bbf289d846208c16edc8474705c748aff07732db000000000000000000000000000000000000000000000000000000000000000a';

// need to init tStorage
const tStorage = ['0xaf63dba574b8df870564c0cfef95996d0bf09a9de28de1e31994eb090e8e7737',
'0x00000000000000000000000000000000000000000000000000000000000003e8',
'0x0000000000000000000000000000000000000000000000000000000000000002',
'0x00000000000000000000000000000000000000000000000000000000000003e8'];

// callee
const calleeCode = '608060405234801561001057600080fd5b50600436106100415760003560e01c80632e52d606146100465780633f7a02701461006457806367e404ce14610092575b600080fd5b61004e6100dc565b6040518082815260200191505060405180910390f35b6100906004803603602081101561007a57600080fd5b81019080803590602001909291905050506100e2565b005b61009a61012d565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b60005481565b8060008190555033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff168156fea165627a7a7230582084e6da844eca2d216f428331be44abae30c54f60a8dca098061a909be1610e3d0029';
const calleeTstorage = ['0xaf63dba574b8df870564c0cfef95996d0bf09a9de28de1e31994eb090e8e7737',
'0x00000000000000000000000000000000000000000000000000000000000003e8',
'0x0000000000000000000000000000000000000000000000000000000000000002',
'0x00000000000000000000000000000000000000000000000000000000000003e8']; 

const accounts = [
    {
      address: web3.utils.toChecksumAddress('692a70D2e424a56D2C6C27aA97D1a86395877b3A'),
      code: code,
      tStorage: tStorage,
      nonce: new BN(0x1, 16),
      balance: new BN(0xa, 16),
      storageRoot: OP.ZERO_HASH,
      codeHash: OP.ZERO_HASH
    },
    // callee
    {
        address: web3.utils.toChecksumAddress('bBF289D846208c16EDc8474705C748aff07732dB'),
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
      
      // console.log('calldepth 0', utils.rlp.decode(steps[i].calleeAccount.rlpVal)[3])
      // console.log('calldepth 0', steps[i].stateRoot.toString('hex'));
        if (steps[i].opCodeName === 'DELEGATECALL') {
          // console.log('DELEGATECALL')
          // console.log('calldepth 0', steps[i].calleeStateProof)
          const calleeSteps = steps[i].calleeSteps;
          const len = calleeSteps.length;
          for (let i = 0; i < len; i++){
            // console.log('calldepth 1', calleeSteps[i].stateRoot.toString('hex'));
            // console.log('calldepth 1', calleeSteps[i].stateRoot.toString('hex'))
            // console.log('calldepth 1', utils.rlp.decode(calleeSteps[i].calleeAccount.rlpVal)[3])
              if (calleeSteps[i].opCodeName === 'SSTORE') {
                // console.log('calldepth 1', i)
              }
              // if (calleeSteps[i].opCodeName === 'SLOAD') {
              //   console.log('calldepth 1', i)
              // }
           
          }
        
        }
    }

   
      
    merkle = await new Merkelizer().run(steps, code, data, tStorage);
    // console.log(merkle.printLeave());
})();