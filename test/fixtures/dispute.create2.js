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

    const code = '608060405234801561001057600080fd5b50600436106100415760003560e01c80630bd38f2f146100465780637133b0641461007e578063e332e6c1146100c8575b600080fd5b61007c6004803603604081101561005c57600080fd5b810190808035906020019092919080359060200190929190505050610112565b005b610086610329565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6100d061034e565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b60ff60f81b30836040518060200161012990610374565b6020820181038252601f19601f82011660405250846040516020018083805190602001908083835b602083106101745780518252602082019150602081019050602083039250610151565b6001836020036101000a038019825116818451168082178552505050505050905001828152602001925050506040516020818303038152906040528051906020012060405160200180857effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff19167effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff191681526001018473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1660601b81526014018381526020018281526020019450505050506040516020818303038152906040528051906020012060601c600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600082826040516102b790610374565b808281526020019150508190604051809103906000f59050801580156102e1573d6000803e3d6000fd5b509050806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550505050565b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60df806103818339019056fe608060405234801561001057600080fd5b506040516100df3803806100df8339818101604052602081101561003357600080fd5b8101908080519060200190929190505050806000819055505060858061005a6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80630c55699c14602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000548156fea26469706673582212200075a6935ae1a8e69cac7a8e97695ed5b5c681c3fb05f2c42f5b168b0aa15b7c64736f6c63430006060033a264697066735822122084afc4a45d61f4c451bf88705a4bf458789b91c631531946ff932ab2d3cc8bd164736f6c63430006060033';
    const data = '0x0bd38f2f00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001';
    const tStorage = [];

    const accounts = [
        // caller
        {
          address: '0x9069B7d897B6f66332D15821aD2f95609c81E59a',
          code: code,
          tStorage: tStorage,
          nonce: new BN(0x2, 16),
          balance: new BN(0x64, 16),
          storageRoot: OP.ZERO_HASH,
          codeHash: OP.ZERO_HASH
        },
    ];

    let steps;
    let copy;
    let calleeCopy;
    let merkle;
    
    beforeEach(async () => {
      const runtime = new HydratedRuntime();
      steps = await runtime.run({ accounts, code, data, pc: 0, tStorage: tStorage});
      copy = _.cloneDeep(steps);
      // opcode CREATE2 step 467, SSTORE 51, 
      calleeCopy = _.cloneDeep(steps[467].calleeSteps);
      merkle = new Merkelizer().run(steps, code, data, tStorage);
    });

    it('solver has an wrong stateProof at FirstStep', async () => {
      const wrongExecution = copy;
     
      wrongExecution[0].stateRoot = Buffer.alloc(32);
      wrongExecution[0].callerAccount.rlpVal = Buffer.alloc(32);
      
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger has an wrong stateProof at FirstStep', async () => {
      const wrongExecution = copy;
     
      wrongExecution[0].stateRoot = Buffer.alloc(32);
      wrongExecution[0].callerAccount.rlpVal = Buffer.alloc(32);

      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver has an wrong storageProof at SSTORE', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy;

      wrongCalleeStep[51].storageRoot = Buffer.alloc(32);
      wrongCalleeStep[51].storageProof.storageRoot = Buffer.alloc(32);
      wrongExecution[467].calleeSteps = wrongCalleeStep;
            
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger has an wrong storageProof at SSTORE', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy;
      
      wrongCalleeStep[51].storageRoot = Buffer.alloc(32);
      wrongCalleeStep[51].storageProof.storageRoot = Buffer.alloc(32);
      wrongExecution[467].calleeSteps = wrongCalleeStep;

      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver has an wrong stateProof at CALLStart', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy;

      wrongCalleeStep[0].stateRoot = Buffer.alloc(32);
      wrongCalleeStep[0].callerAccount.rlpVal = Buffer.alloc(32);
      wrongExecution[467].calleeSteps = wrongCalleeStep;
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger has an wrong stateProof at CALLStart', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy;

      wrongCalleeStep[0].stateRoot = Buffer.alloc(32);
      wrongCalleeStep[0].callerAccount.rlpVal = Buffer.alloc(32);
      wrongExecution[467].calleeSteps = wrongCalleeStep;
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver has an wrong stateProof at CALLEnd', async () => {
      const wrongExecution = copy;
      wrongExecution[467].stateRoot = Buffer.alloc(32);
      wrongExecution[467].callerAccount.rlpVal = Buffer.alloc(32);
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger has an wrong stateProof at CALLEnd', async () => {
      const wrongExecution = copy;
      wrongExecution[467].stateRoot = Buffer.alloc(32);
      wrongExecution[467].callerAccount.rlpVal = Buffer.alloc(32);
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver first step missing in CALLEE', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy;

      wrongCalleeStep.shift();
      wrongExecution[467].calleeSteps = wrongCalleeStep;
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });    

    it('challenger first step missing in CALLEE', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy;

      wrongCalleeStep.shift();
      wrongExecution[467].calleeSteps = wrongCalleeStep;
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver has an wrong afterStateRoot at FirstStep', async () => {
      const wrongExecution = copy;
     
      wrongExecution[0].stateRoot = Buffer.alloc(32);
            
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger has an wrong afterStateRoot at FirstStep', async () => {
      const wrongExecution = copy;
     
      wrongExecution[0].stateRoot = Buffer.alloc(32);
     
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver has an wrong afterStateRoot at CALLStart', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy;

      wrongCalleeStep[0].stateRoot = Buffer.alloc(32);
      wrongExecution[467].calleeSteps = wrongCalleeStep;

      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger has an wrong afterStateRoot at CALLStart', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy;

      wrongCalleeStep[0].stateRoot = Buffer.alloc(32);
      wrongExecution[467].calleeSteps = wrongCalleeStep;
      
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver has an wrong afterStateRoot at CALLEnd', async () => {
      const wrongExecution = copy;
      
      wrongExecution[467].stateRoot = Buffer.alloc(32);
      wrongExecution[467].callerAccount.rlpVal = Buffer.alloc(32);

      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger has an wrong afterStateRoot at CALLEnd', async () => {
      const wrongExecution = copy;
      
      wrongExecution[467].stateRoot = Buffer.alloc(32);
      wrongExecution[467].callerAccount.rlpVal = Buffer.alloc(32);
      
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver has an output error somewhere in CALLEE step', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy;
      
      wrongCalleeStep[6].compactStack.push('0x0000000000000000000000000000000000000000000000000000000000000001');
      wrongCalleeStep[6].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
      wrongExecution[467].calleeSteps[6] = wrongCalleeStep[6];
      
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger has an output error somewhere in CALLEE step', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy;
      
      wrongCalleeStep[6].compactStack.push('0x0000000000000000000000000000000000000000000000000000000000000001');
      wrongCalleeStep[6].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
      wrongExecution[467].calleeSteps[6] = wrongCalleeStep[6];
      
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });
  });
};
