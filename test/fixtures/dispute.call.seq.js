'use strict';

const HydratedRuntime = require('./../../utils/HydratedRuntime');
const Merkelizer = require('../../utils/Merkelizer');
const OP = require('../../utils/constants');
const debug = require('debug')('dispute-test');
const _ = require('lodash');
const web3 = require('web3');

module.exports = (callback) => {
  describe('Fixture for Dispute/Verifier Logic #1', function () {    
    
    // caller
    const code = '60806040526004361061003a5760003560e01c63ffffffff1680632e52d6061461003f57806367e404ce1461006a578063cf55fe38146100c1575b600080fd5b34801561004b57600080fd5b5061005461014e565b6040518082815260200191505060405180910390f35b34801561007657600080fd5b5061007f610154565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b3480156100cd57600080fd5b5061014c600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061017a565b005b60005481565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b8373ffffffffffffffffffffffffffffffffffffffff1660405180807f63616c6c5365744e28616464726573732c616464726573732c75696e7432353681526020017f29000000000000000000000000000000000000000000000000000000000000008152506021019050604051809103902060e01c8484846040518463ffffffff1660e01b8152600401808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020018373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200182815260200193505050506000604051808303816000875af19250505050505050505600a165627a7a72305820ac6d613d72a5e72e4c72b7ae65ca6d5997ecc27f256d0688d99787301100e3ea0029';
    const data = '0xcf55fe38000000000000000000000000bbf289d846208c16edc8474705c748aff07732db0000000000000000000000000dcd2f752394c41875e259e00bb44fd505297caf0000000000000000000000005e72914535f202659083db3a02c984188fa26e9f000000000000000000000000000000000000000000000000000000000000000a';
    const tStorage = ['0x0000000000000000000000000000000000000000000000000000000000000002',
    '0x00000000000000000000000000000000000000000000000000000000000003e8'];

    // callee1
    const calleeCode1 = '60806040526004361061003a5760003560e01c63ffffffff1680631e7c8d9f1461003f5780632e52d606146100ac57806367e404ce146100d7575b600080fd5b34801561004b57600080fd5b506100aa600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061012e565b005b3480156100b857600080fd5b506100c16101e7565b6040518082815260200191505060405180910390f35b3480156100e357600080fd5b506100ec6101ed565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b8273ffffffffffffffffffffffffffffffffffffffff1660405180807f63616c6c5365744e28616464726573732c75696e7432353629000000000000008152506019019050604051809103902060e01c83836040518363ffffffff1660e01b8152600401808373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001828152602001925050506000604051808303816000875af19250505050505050565b60005481565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16815600a165627a7a72305820613c2dd6700b29643b199dd90318ef9c3921268b1ba561f32d7a4b56410141800029';
    const calleeTstorage1 = ['0x0000000000000000000000000000000000000000000000000000000000000002',
    '0x00000000000000000000000000000000000000000000000000000000000003e8'];
    
    // callee2
    const calleeCode2 = '60806040526004361061003a5760003560e01c63ffffffff1680632e52d6061461003f57806367e404ce1461006a578063eea4c864146100c1575b600080fd5b34801561004b57600080fd5b5061005461010e565b6040518082815260200191505060405180910390f35b34801561007657600080fd5b5061007f610114565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b3480156100cd57600080fd5b5061010c600480360381019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061013a565b005b60005481565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b8173ffffffffffffffffffffffffffffffffffffffff1660405180807f7365744e2875696e743235362900000000000000000000000000000000000000815250600d019050604051809103902060e01c826040518263ffffffff1660e01b8152600401808281526020019150506000604051808303816000875af1925050505050505600a165627a7a72305820ccbbe752d1454d27a433dcf8946582390aa84d04fa88c9e897a2ef59063aefc70029'
    const calleeTstorage2 = ['0x0000000000000000000000000000000000000000000000000000000000000002',
    '0x00000000000000000000000000000000000000000000000000000000000003e8'];

    // callee3
    const calleeCode3 = '60806040526004361061003a5760003560e01c63ffffffff1680632e52d6061461003f5780633f7a02701461006a57806367e404ce14610097575b600080fd5b34801561004b57600080fd5b506100546100ee565b6040518082815260200191505060405180910390f35b34801561007657600080fd5b50610095600480360381019080803590602001909291905050506100f4565b005b3480156100a357600080fd5b506100ac61013f565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b60005481565b8060008190555033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16815600a165627a7a72305820b8a02385f0c077545e8d60ea0d930c9c0adf264367984b7f6686e3f368acb44f0029'
    const calleeTstorage3 = ['0x0000000000000000000000000000000000000000000000000000000000000002',
    '0x00000000000000000000000000000000000000000000000000000000000003e8'];

    const accounts = [
      // caller
      {
        address: web3.utils.toChecksumAddress('692a70D2e424a56D2C6C27aA97D1a86395877b3A'),
        code: code,
        tStorage: tStorage
      },
      // callee1
      {
          address: web3.utils.toChecksumAddress('bBF289D846208c16EDc8474705C748aff07732dB'),
          code: calleeCode1,
          tStorage: calleeTstorage1
      },
        // callee2
      {
          address: web3.utils.toChecksumAddress('0DCd2F752394c41875e259e00bb44fd505297caF'),
          code: calleeCode2,
          tStorage: calleeTstorage2
      },
      // callee3
      {
          address: web3.utils.toChecksumAddress('5E72914535f202659083Db3a02C984188Fa26e9f'),
          code: calleeCode3,
          tStorage: calleeTstorage3
      }
  ];

    let steps;
    let copy;
    let calleeCopy1;
    let calleeCopy2;
    let calleeCopy3;
    let merkle;
    const runtime = new HydratedRuntime();

    beforeEach(async () => {
      steps = await runtime.run({ accounts, code, data, pc: 0, tStorage: tStorage });
      copy = _.cloneDeep(steps);
      // opcode CALL step 176, 139, 127
      calleeCopy1 = _.cloneDeep(steps[176].calleeSteps);
      calleeCopy2 = _.cloneDeep(steps[176].calleeSteps[139].calleeSteps);
      calleeCopy3 = _.cloneDeep(steps[176].calleeSteps[139].calleeSteps[127].calleeSteps);
      
      merkle = new Merkelizer().run(steps, code, data, tStorage);
    });

    // it('solver has an wrong stateProof at FirstStep', async () => {
    //   const wrongExecution = copy;
     
    //   wrongExecution[0].stateRoot = Buffer.alloc(32);
            
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong stateProof at FirstStep', async () => {
    //   const wrongExecution = copy;
     
    //   wrongExecution[0].stateRoot = Buffer.alloc(32);
      
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solever has an wrong stateProof at SSTORE', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep1 = calleeCopy1;
    //   const wrongCalleeStep2 = calleeCopy2;
    //   const wrongCalleeStep3 = calleeCopy3;
      
    //   wrongCalleeStep3[60].stateRoot = Buffer.alloc(32);
     
    //   wrongCalleeStep2[127].calleeSteps = wrongCalleeStep3;
    //   wrongCalleeStep1[139].calleeSteps = wrongCalleeStep2;
    //   wrongExecution[176].calleeSteps = wrongCalleeStep1;
    //   const soleverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, soleverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong stateProof at SSTORE', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep1 = calleeCopy1;
    //   const wrongCalleeStep2 = calleeCopy2;
    //   const wrongCalleeStep3 = calleeCopy3;
      
    //   wrongCalleeStep3[60].stateRoot = Buffer.alloc(32);
      
    //   wrongCalleeStep2[127].calleeSteps = wrongCalleeStep3;
    //   wrongCalleeStep1[139].calleeSteps = wrongCalleeStep2;
    //   wrongExecution[176].calleeSteps = wrongCalleeStep1;
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });    

    // it('solever has an wrong stateProof at SSTORE', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep1 = calleeCopy1;
    //   const wrongCalleeStep2 = calleeCopy2;
    //   const wrongCalleeStep3 = calleeCopy3;
      
    //   wrongCalleeStep3[81].stateRoot = Buffer.alloc(32);
      
    //   wrongCalleeStep2[127].calleeSteps = wrongCalleeStep3;
    //   wrongCalleeStep1[139].calleeSteps = wrongCalleeStep2;
    //   wrongExecution[176].calleeSteps = wrongCalleeStep1;
    //   const soleverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, soleverMerkle, merkle, 'challenger');
    // });

    it('challenger has an wrong stateProof at SSTORE', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep1 = calleeCopy1;
      const wrongCalleeStep2 = calleeCopy2;
      const wrongCalleeStep3 = calleeCopy3;
      
      wrongCalleeStep3[81].stateRoot = Buffer.alloc(32);
      
      wrongCalleeStep2[127].calleeSteps = wrongCalleeStep3;
      wrongCalleeStep1[139].calleeSteps = wrongCalleeStep2;
      wrongExecution[176].calleeSteps = wrongCalleeStep1;
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });    

    // it('solver has an wrong stateProof at CALLStart depth 1', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep = calleeCopy1;
      
    //   wrongCalleeStep[0].stateRoot = Buffer.alloc(32);
      
    //   wrongExecution[176].calleeSteps = wrongCalleeStep;
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong stateProof at CALLStart depth 1', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep = calleeCopy1;
      
    //   wrongCalleeStep[0].stateRoot = Buffer.alloc(32);
      
    //   wrongExecution[176].calleeSteps = wrongCalleeStep;
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solver has an wrong stateProof at CALLEnd depth 1', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[176].stateRoot = Buffer.alloc(32);
      
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong stateProof at CALLEnd depth 1', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[176].stateRoot = Buffer.alloc(32);
     
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solver has an wrong stateProof at CALL start depth 2', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep1 = calleeCopy1;
    //   const wrongCalleeStep2 = calleeCopy2;
      
    //   wrongCalleeStep2[0].stateRoot = Buffer.alloc(32);
    
    //   wrongCalleeStep1[139].calleeSteps = wrongCalleeStep2;
    //   wrongExecution[176].calleeSteps = wrongCalleeStep1;
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong stateProof at CALL start depth 2', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep1 = calleeCopy1;
    //   const wrongCalleeStep2 = calleeCopy2;
      
    //   wrongCalleeStep2[0].stateRoot = Buffer.alloc(32);
     
    //   wrongCalleeStep1[139].calleeSteps = wrongCalleeStep2;
    //   wrongExecution[176].calleeSteps = wrongCalleeStep1;
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solver has an wrong stateProof at CALLEnd depth 2', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep1 = calleeCopy1;
          
    //   wrongCalleeStep1[139].stateRoot = Buffer.alloc(32);
      
    //   wrongExecution[176].calleeSteps = wrongCalleeStep1;
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong stateProof at CALLEnd depth 2', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep1 = calleeCopy1;
            
    //   wrongCalleeStep1[139].stateRoot = Buffer.alloc(32);
      
    //   wrongExecution[176].calleeSteps = wrongCalleeStep1;
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solver has an wrong stateProof at CALL start depth 3', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep1 = calleeCopy1;
    //   const wrongCalleeStep2 = calleeCopy2;
    //   const wrongCalleeStep3 = calleeCopy3;
      
    //   wrongCalleeStep3[0].stateRoot = Buffer.alloc(32);
     
    //   wrongCalleeStep2[127].calleeSteps = wrongCalleeStep3;
    //   wrongCalleeStep1[139].calleeSteps = wrongCalleeStep2;
    //   wrongExecution[176].calleeSteps = wrongCalleeStep1;
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong stateProof at CALL start depth 3', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep1 = calleeCopy1;
    //   const wrongCalleeStep2 = calleeCopy2;
    //   const wrongCalleeStep3 = calleeCopy3;
      
    //   wrongCalleeStep3[0].stateRoot = Buffer.alloc(32);
     
    //   wrongCalleeStep2[127].calleeSteps = wrongCalleeStep3;
    //   wrongCalleeStep1[139].calleeSteps = wrongCalleeStep2;
    //   wrongExecution[176].calleeSteps = wrongCalleeStep1;
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });   
    
    // it('solver has an wrong stateProof at CALLEnd depth 3', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep1 = calleeCopy1;
    //   const wrongCalleeStep2 = calleeCopy2;
          
    //   wrongCalleeStep2[127].stateRoot = Buffer.alloc(32);
      
    //   wrongCalleeStep1[139].calleeSteps = wrongCalleeStep2;
    //   wrongExecution[176].calleeSteps = wrongCalleeStep1;
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong stateProof at CALLEnd depth 3', async () => {
    //   const wrongExecution = copy;
    //   const wrongCalleeStep1 = calleeCopy1;
    //   const wrongCalleeStep2 = calleeCopy2;
          
    //   wrongCalleeStep2[127].stateRoot = Buffer.alloc(32);
      
    //   wrongCalleeStep1[139].calleeSteps = wrongCalleeStep2;
    //   wrongExecution[176].calleeSteps = wrongCalleeStep1;
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });
  });
};
