'use strict';

const HydratedRuntime = require('./../../utils/HydratedRuntime');
const Merkelizer = require('../../utils/Merkelizer');
const OP = require('../../utils/constants');
const utils = require('ethereumjs-util');
const BN = utils.BN;
const debug = require('debug')('dispute-test');
const web3 = require('web3');
const _ = require('lodash');

module.exports = (callback) => {
  describe('Fixture for Dispute/Verifier Logic #1', function () { 

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
    let calleeCopy;
    let merkle;
    
    beforeEach(async () => {
      const runtime = new HydratedRuntime();
      steps = await runtime.run({ accounts, code, data, pc: 0, tStorage: tStorage, pc: 0 });
      copy = _.cloneDeep(steps);
      // opcode CALL step 217, SSTORE 65, 86, SLOAD 73
      calleeCopy = _.cloneDeep(steps[217].calleeSteps);
      merkle = new Merkelizer().run(steps, code, data, tStorage);
    });

    // it('solver has an wrong stateProof at FirstStep', async () => {
    //   const wrongExecution = copy;
     
    //   wrongExecution[0].stateRoot = Buffer.alloc(32);
    //   wrongExecution[0].callerAccount.rlpVal = Buffer.alloc(32);
      
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong stateProof at FirstStep', async () => {
    //   const wrongExecution = copy;
     
    //   wrongExecution[0].stateRoot = Buffer.alloc(32);
    //   wrongExecution[0].callerAccount.rlpVal = Buffer.alloc(32);

    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solver has an wrong storageProof at SSTORE', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep = calleeCopy;

    //   wrongCalleeStep[65].storageRoot = Buffer.alloc(32);
    //   wrongCalleeStep[65].storageProof.storageRoot = Buffer.alloc(32);
    //   wrongExecution[217].calleeSteps = wrongCalleeStep;
            
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong storageProof at SSTORE', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep = calleeCopy;
      
    //   wrongCalleeStep[65].storageRoot = Buffer.alloc(32);
    //   wrongCalleeStep[65].storageProof.storageRoot = Buffer.alloc(32);
    //   wrongExecution[217].calleeSteps = wrongCalleeStep;

    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solver has an wrong stateProof at CALLStart', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep = calleeCopy;

    //   wrongCalleeStep[0].stateRoot = Buffer.alloc(32);
    //   wrongCalleeStep[0].callerAccount.rlpVal = Buffer.alloc(32);
    //   wrongExecution[217].calleeSteps = wrongCalleeStep;
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong stateProof at CALLStart', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep = calleeCopy;

    //   wrongCalleeStep[0].stateRoot = Buffer.alloc(32);
    //   wrongCalleeStep[0].callerAccount.rlpVal = Buffer.alloc(32);
    //   wrongExecution[217].calleeSteps = wrongCalleeStep;
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solver has an wrong stateProof at CALLEnd', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[217].stateRoot = Buffer.alloc(32);
    //   wrongExecution[217].callerAccount.rlpVal = Buffer.alloc(32);
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong stateProof at CALLEnd', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[217].stateRoot = Buffer.alloc(32);
    //   wrongExecution[217].callerAccount.rlpVal = Buffer.alloc(32);
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solver first step missing in CALLEE', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep = calleeCopy;

    //   wrongCalleeStep.shift();
    //   wrongExecution[217].calleeSteps = wrongCalleeStep;
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });    

    // it('challenger first step missing in CALLEE', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep = calleeCopy;

    //   wrongCalleeStep.shift();
    //   wrongExecution[217].calleeSteps = wrongCalleeStep;
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solver has an wrong afterStateRoot at FirstStep', async () => {
    //   const wrongExecution = copy;
     
    //   wrongExecution[0].stateRoot = Buffer.alloc(32);
            
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong afterStateRoot at FirstStep', async () => {
    //   const wrongExecution = copy;
     
    //   wrongExecution[0].stateRoot = Buffer.alloc(32);
     
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solver has an wrong afterStateRoot at CALLStart', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep = calleeCopy;

    //   wrongCalleeStep[0].stateRoot = Buffer.alloc(32);
    //   wrongExecution[217].calleeSteps = wrongCalleeStep;

    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong afterStateRoot at CALLStart', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep = calleeCopy;

    //   wrongCalleeStep[0].stateRoot = Buffer.alloc(32);
    //   wrongExecution[217].calleeSteps = wrongCalleeStep;
      
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solver has an wrong afterStateRoot at CALLEnd', async () => {
    //   const wrongExecution = copy;
      
    //   wrongExecution[217].stateRoot = Buffer.alloc(32);
    //   wrongExecution[217].callerAccount.rlpVal = Buffer.alloc(32);

    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong afterStateRoot at CALLEnd', async () => {
    //   const wrongExecution = copy;
      
    //   wrongExecution[217].stateRoot = Buffer.alloc(32);
    //   wrongExecution[217].callerAccount.rlpVal = Buffer.alloc(32);
      
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solver has an wrong afterStateRoot at SLOAD', async () => {
    //   const wrongExecution = copy;
    //   // opcode SLOAD
    //   wrongExecution[73].stateRoot = Buffer.alloc(32);
      
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    it('challenger has an wrong afterStateRoot at SLOAD', async () => {
      const wrongExecution = copy;
      // opcode SLOAD
      wrongExecution[73].stateRoot = Buffer.alloc(32);
      
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    // it('solver has an output error somewhere in CALLEE step', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep = calleeCopy;
      
    //   wrongCalleeStep[6].compactStack.push('0x0000000000000000000000000000000000000000000000000000000000000001');
    //   wrongCalleeStep[6].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
    //   wrongExecution[217].calleeSteps[6] = wrongCalleeStep[6];
      
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an output error somewhere in CALLEE step', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep = calleeCopy;
      
    //   wrongCalleeStep[6].compactStack.push('0x0000000000000000000000000000000000000000000000000000000000000001');
    //   wrongCalleeStep[6].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
    //   wrongExecution[217].calleeSteps[6] = wrongCalleeStep[6];
      
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });
  });
};
