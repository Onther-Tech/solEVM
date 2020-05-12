'use strict';

const HydratedRuntime = require('./../../utils/HydratedRuntime');
const Merkelizer = require('../../utils/Merkelizer');
const OP = require('../../utils/constants');
const utils = require('ethereumjs-util');
const BN = utils.BN;
const debug = require('debug')('dispute-test');
const web3 = require('web3');
const _ = require('lodash');
const SMT = require('../../utils/smt/SparseMerkleTrie').SMT;
const FragmentTree = require('../../utils/FragmentTree');
function HexToBuf (val) {
  val = val.replace('0x', '');
  return Buffer.from(val, 'hex');
}

module.exports = (callback) => {
  describe('Fixture for Dispute/Verifier Logic #1', function () { 

    const code = '6080604052600436106100295760003560e01c806395fe0e651461002e578063e92f917614610069575b600080fd5b34801561003a57600080fd5b506100676004803603602081101561005157600080fd5b81019080803590602001909291905050506100a1565b005b61009f6004803603604081101561007f57600080fd5b81019080803590602001909291908035906020019092919050505061015f565b005b6000816040516100b090610226565b80828152602001915050604051809103906000f0801580156100d6573d6000803e3d6000fd5b5090508073ffffffffffffffffffffffffffffffffffffffff16630c55699c6040518163ffffffff1660e01b815260040160206040518083038186803b15801561011f57600080fd5b505afa158015610133573d6000803e3d6000fd5b505050506040513d602081101561014957600080fd5b8101908080519060200190929190505050505050565b600081600a8460405161017190610226565b8082815260200191505082906040518091039083f5905090508015801561019c573d6000803e3d6000fd5b5090508073ffffffffffffffffffffffffffffffffffffffff16630c55699c6040518163ffffffff1660e01b815260040160206040518083038186803b1580156101e557600080fd5b505afa1580156101f9573d6000803e3d6000fd5b505050506040513d602081101561020f57600080fd5b810190808051906020019092919050505050505050565b60d1806102338339019056fe60806040526040516100d13803806100d183398181016040526020811015602557600080fd5b8101908080519060200190929190505050806000819055505060858061004c6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80630c55699c14602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000548156fea2646970667358221220084bd8f97f4d5a652b73889570e925e9e235438d4d278444c991371d4cc9a36e64736f6c63430006060033a26469706673582212209c01b817d1f033b338090859604bdc1a19fe4a637be281e7c1a8547b58d7761e64736f6c63430006060033';
    const data = '0xe92f9176000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000001';
    const tStorage = [];

    const calleeInitCode = '0x60806040526040516100d13803806100d183398181016040526020811015602557600080fd5b8101908080519060200190929190505050806000819055505060858061004c6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80630c55699c14602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000548156fea2646970667358221220084bd8f97f4d5a652b73889570e925e9e235438d4d278444c991371d4cc9a36e64736f6c63430006060033000000000000000000000000000000000000000000000000000000000000000a'
    const salt = '0x0000000000000000000000000000000000000000000000000000000000000001';
    const calleeCode = '6080604052348015600f57600080fd5b506004361060285760003560e01c80630c55699c14602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000548156fea2646970667358221220f2fca7a216de8421ed556c8159c89b254549ccd60cf2290f918db228de49ca2264736f6c63430006070033'
    const calleeTstorage = [];

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
    
    const generateAddress = utils.generateAddress2(accounts[0].address, salt, calleeInitCode);
    
    const createdAccount = {
      address: web3.utils.toChecksumAddress(generateAddress.toString('hex')),
      code: calleeCode,
      tStorage: calleeTstorage,
      nonce: new BN(0x1, 16),
      balance: new BN(0x64, 16),
      storageRoot: OP.ZERO_HASH,
      codeHash: OP.ZERO_HASH
    }

    let steps;
    let copy;
    let calleeCopy;
    let merkle;
    
    let smt;

    let caller;
    let callee;

    let callerKey;
    let calleeKey;

    let callerVal;
    let calleeVal;

    let callerRlpVal;
    let calleeRlpVal;
        
    beforeEach(async () => {
      const runtime = new HydratedRuntime();
      steps = await runtime.run({ accounts, code, data, pc: 0, tStorage: tStorage, stepCount: 355 });
      copy = _.cloneDeep(steps);
      // opcode CREATE2 step
      calleeCopy = _.cloneDeep(steps[101].calleeSteps);
      merkle = new Merkelizer().run(steps, code, data, tStorage);

      smt = new SMT();
     
      caller = accounts[0];
      callee = createdAccount;

      callerKey = smt.hash(caller.address);
      calleeKey = smt.hash(callee.address);
      
      caller.storageRoot = '0xa7ff9e28ffd3def443d324547688c2c4eb98edf7da757d6bfa22bff55b9ce24a';
      callee.storageRoot = '0xa7ff9e28ffd3def443d324547688c2c4eb98edf7da757d6bfa22bff55b9ce24a';

      const callerCodeFragmentTree = new FragmentTree().run(caller.code);
      const callerCodeRootHash = callerCodeFragmentTree.root.hash;

      const calleeCodeFragmentTree = new FragmentTree().run(callee.code);
      const calleeCodeRootHash = calleeCodeFragmentTree.root.hash;

      caller.codeHash = callerCodeRootHash;
      callee.codeHash = calleeCodeRootHash;

      callerVal = [
        caller.nonce, caller.balance, caller.codeHash, caller.storageRoot
      ];
      calleeVal = [
        callee.nonce, callee.balance, callee.codeHash, callee.storageRoot
      ];

      callerRlpVal = utils.rlp.encode(callerVal);
      calleeRlpVal = utils.rlp.encode(calleeVal);
      smt.putData(callerKey, callerRlpVal);
      smt.putData(calleeKey, calleeRlpVal);

      // console.log(smt.root);
    });

    it('solver manipulate stateRoot #1 - replace with wrong value at CREATE with value', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy;
     
      const wrongVal = 11;
     
      // set wrong rlpVal
      callerVal[1] -= wrongVal;
      calleeVal[1] += wrongVal;
      // console.log('callerVal', callerVal)
      // console.log('calleeVal', calleeVal)

      const callerRlpVal = utils.rlp.encode(callerVal);
      const calleeRlpVal = utils.rlp.encode(calleeVal);

      // put wrong val
      smt.putData(callerKey, callerRlpVal);
      smt.putData(calleeKey, calleeRlpVal);

      // get wrong rootHash
      const rootHash = smt.root;
      // console.log('rootHash', rootHash);

      // set wrong stateRoot
      wrongCalleeStep[0].stateRoot = rootHash;
      wrongCalleeStep[0].callValueProof.afterRoot = rootHash;
      wrongExecution[101].calleeSteps = wrongCalleeStep;

      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger manipulate stateRoot #1 - replace with wrong value at CREATE with value', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy;
     
      const wrongVal = 11;
     
      // set wrong rlpVal
      callerVal[1] -= wrongVal;
      calleeVal[1] += wrongVal;
      // console.log('callerVal', callerVal)
      // console.log('calleeVal', calleeVal)

      const callerRlpVal = utils.rlp.encode(callerVal);
      const calleeRlpVal = utils.rlp.encode(calleeVal);

      // put wrong val
      smt.putData(callerKey, callerRlpVal);
      smt.putData(calleeKey, calleeRlpVal);

      // get wrong rootHash
      const rootHash = smt.root;
      // console.log('rootHash', rootHash);

      // set wrong stateRoot
      wrongCalleeStep[0].stateRoot = rootHash;
      wrongCalleeStep[0].callValueProof.afterRoot = rootHash;
      wrongExecution[101].calleeSteps = wrongCalleeStep;
      
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver manipulate stateRoot #2 - add wrong value at CREATE with value', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy;
      
      // set correct val - 10
      const correctVal = 10;

      // get correct rlpVal
      callerVal[1] -= correctVal;
      calleeVal[1] += correctVal;
      // console.log('callerVal', callerVal)
      // console.log('calleeVal', calleeVal)
      
      const callerRlpVal = utils.rlp.encode(callerVal);
      const calleeRlpVal = utils.rlp.encode(calleeVal);

      // put correct val
      smt.putData(callerKey, callerRlpVal);
      smt.putData(calleeKey, calleeRlpVal);

      // put wrong val
      const wrongKey = utils.keccak256('0');
      const wrongRlpVal = callerRlpVal;
      smt.putData(wrongKey, wrongRlpVal);

      // get wrong rootHash
      const rootHash = smt.root;
      // console.log('rootHash', rootHash);

      // set wrong stateRoot
      wrongCalleeStep[0].stateRoot = rootHash;
      wrongCalleeStep[0].callValueProof.afterRoot = rootHash;
      wrongExecution[101].calleeSteps = wrongCalleeStep;

      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger manipulate stateRoot #2 - add wrong value at CREATE with value', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy;
      
      // set correct val - 10
      const correctVal = 10;

      // get correct rlpVal
      callerVal[1] -= correctVal;
      calleeVal[1] += correctVal;
      // console.log('callerVal', callerVal)
      // console.log('calleeVal', calleeVal)
      
      const callerRlpVal = utils.rlp.encode(callerVal);
      const calleeRlpVal = utils.rlp.encode(calleeVal);

      // put correct val
      smt.putData(callerKey, callerRlpVal);
      smt.putData(calleeKey, calleeRlpVal);

      // put wrong val
      const wrongKey = utils.keccak256('0');
      const wrongRlpVal = callerRlpVal;
      smt.putData(wrongKey, wrongRlpVal);

      // get wrong rootHash
      const rootHash = smt.root;
      // console.log('rootHash', rootHash);

      // set wrong stateRoot
      wrongCalleeStep[0].stateRoot = rootHash;
      wrongCalleeStep[0].callValueProof.afterRoot = rootHash;
      wrongExecution[101].calleeSteps = wrongCalleeStep;

      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });
  });
};
