'use strict';

const HydratedRuntime = require('./../../utils/HydratedRuntime');
const Merkelizer = require('../../utils/Merkelizer');
const OP = require('../../utils/constants');
const debug = require('debug')('dispute-test');
const _ = require('lodash');
const SMT = require('../../utils/smt/SparseMerkleTrie').SMT;
function HexToBuf (val) {
  val = val.replace('0x', '');
  return Buffer.from(val, 'hex');
}

module.exports = (callback) => {
  describe('Fixture for Dispute/Verifier Logic #1', function () {
    let code = [
      OP.PUSH1, '03',
      OP.PUSH1, '05',
      OP.ADD,
      OP.PUSH1, 'ff',
      OP.PUSH1, '00',
      OP.SSTORE,
      OP.PUSH1, 'ff',
      OP.PUSH1, '01',
      OP.SSTORE,
      OP.PUSH1, '00',
      OP.SLOAD,
      OP.PUSH1, '02',
      OP.MSTORE,
      OP.PUSH1, '00',
      OP.MLOAD,
      OP.PUSH1, '00',
      OP.MSTORE,
      OP.PUSH1, 'ff',
      OP.POP,
      OP.PUSH1, 'aa',
      OP.PUSH1, '01',
      OP.SSTORE,
      OP.PUSH1, '00',
      OP.PUSH1, '01',
      OP.DUP1,
      OP.SWAP1,
      OP.CALLDATASIZE,
      OP.CALLDATACOPY,
      OP.GAS,
      OP.PUSH1, '01',
      OP.MSTORE,
      OP.PUSH1, '00',
      OP.PUSH1, '01',
      OP.PUSH1, '00',
      OP.PUSH1, '01',
      OP.SHA3,
      OP.PUSH1, '20',
      OP.PUSH1, '00',
      OP.RETURN,
    ];
    
    // need for convert string
    code = code.join('');

    // need to init tStorage
    const tStorage = [
      '0xaf63dba574b8df870564c0cfef95996d0bf09a9de28de1e31994eb090e8e7737',
      '0x00000000000000000000000000000000000000000000000000000000000003e8',
      '0x0000000000000000000000000000000000000000000000000000000000000002',
      '0x00000000000000000000000000000000000000000000000000000000000003e8'
    ]; 
    const accounts = [
      {
        address: OP.DEFAULT_CONTRACT_ADDRESS,
        code: code,
        tStorage: tStorage,
        nonce: 1,
        balance: 10,
        storageRoot: OP.ZERO_HASH,
        codeHash: OP.ZERO_HASH
      }
    ];
    const data = '0x00010203040506070809';
    
    let steps;
    let copy;
    let merkle;
    let smt;

    beforeEach(async () => {
      const runtime = new HydratedRuntime();
      steps = await runtime.run({ accounts, code, data, tStorage: tStorage });
      copy = _.cloneDeep(steps);
      merkle = new Merkelizer().run(steps, code, data, tStorage);
      
      smt = new SMT();
      const k1 = Buffer.from('af63dba574b8df870564c0cfef95996d0bf09a9de28de1e31994eb090e8e7737', 'hex');
      const v1 = Buffer.from('00000000000000000000000000000000000000000000000000000000000003e8', 'hex');
      const k2 = Buffer.from('0000000000000000000000000000000000000000000000000000000000000002', 'hex');
      const v2 = Buffer.from('00000000000000000000000000000000000000000000000000000000000003e8', 'hex');

      const hashedK1 = smt.hash(k1);
      const hashedK2 = smt.hash(k2);
      smt.putData(hashedK1,v1);
      smt.putData(hashedK2,v2);
    });

    // it('solver manipulate stateRoot #1 - replace with wrong value at SSTORE 5', async () => {
    //   const wrongExecution = copy;
      
    //   // set wrong val
    //   wrongExecution[5].compactStack[0] = '0x0000000000000000000000000000000000000000000000000000000000000fff';
      
    //   // get hashedKey
    //   let key = wrongExecution[5].compactStack[1];
    //   key = HexToBuf(key);
    //   const hashedKey = smt.hash(key);

    //   // get wrong val
    //   let val = wrongExecution[5].compactStack[0];
    //   val = HexToBuf(val);
     
    //   // put wrong val
    //   smt.putData(hashedKey, val);

    //   // get wrong rootHash
    //   const rootHash = smt.root;

    //   wrongExecution[5].storageRoot = rootHash;
    //   wrongExecution[5].storageProof.afterLeaf = smt.hash(val);

    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger manipulate stateRoot #1 - replace with wrong value at SSTORE 5', async () => {
    //   const wrongExecution = copy;
     
    //  // set wrong val
    //   wrongExecution[5].compactStack[0] = '0x0000000000000000000000000000000000000000000000000000000000000fff';
      
    //   // get hashedKey
    //   let key = wrongExecution[5].compactStack[1];
    //   key = HexToBuf(key);

    //   const hashedKey = smt.hash(key);
      
    //   // get wrong val
    //   let val = wrongExecution[5].compactStack[0];
    //   val = HexToBuf(val);
     
    //   // put wrong val
    //   smt.putData(hashedKey, val);

    //   // get wrong rootHash
    //   const rootHash = smt.root;
      
    //   wrongExecution[5].storageRoot = rootHash;
    //   wrongExecution[5].storageProof.afterLeaf = smt.hash(val);   
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solver manipulate stateRoot #2 - add wrong value at SSTORE 5', async () => {
    //   const wrongExecution = copy;
      
    //   // get hashedKey
    //   let key = wrongExecution[5].compactStack[1];
    //   key = HexToBuf(key);
    //   const hashedKey = smt.hash(key);

    //   // get correct val
    //   let val = wrongExecution[5].compactStack[0];
    //   val = HexToBuf(val);
     
    //   // put correct val
    //   smt.putData(hashedKey, val);

    //   // get wrong hashedKey
    //   const wrongKey = Buffer.from('564c0cfef95996d0bf09a9de28de1e31994eb090e8e7737', 'hex');
    //   const wrongHashedKey = smt.hash(wrongKey);

    //   // put val with wrong key
    //   smt.putData(wrongHashedKey, val);
      
    //   // get wrong rootHash
    //   const rootHash = smt.root;

    //   wrongExecution[5].storageRoot = rootHash;
    //   wrongExecution[5].storageProof.afterLeaf = smt.hash(val);

    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger manipulate stateRoot #2 - add wrong value at SSTORE 5', async () => {
    //   const wrongExecution = copy;
     
    //   // get hashedKey
    //   let key = wrongExecution[5].compactStack[1];
    //   key = HexToBuf(key);
    //   const hashedKey = smt.hash(key);

    //   // get correct val
    //   let val = wrongExecution[5].compactStack[0];
    //   val = HexToBuf(val);
     
    //   // put correct val
    //   smt.putData(hashedKey, val);

    //   // get wrong hashedKey
    //   const wrongKey = Buffer.from('564c0cfef95996d0bf09a9de28de1e31994eb090e8e7737', 'hex');
    //   const wrongHashedKey = smt.hash(wrongKey);

    //   // put val with wrong key
    //   smt.putData(wrongHashedKey, val);
      
    //   // get wrong rootHash
    //   const rootHash = smt.root;
      
    //   wrongExecution[5].storageRoot = rootHash;
    //   wrongExecution[5].storageProof.afterLeaf = smt.hash(val);   
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solver manipulate stateRoot at SSTORE 21 in case of reset storage', async () => {
    //   const wrongExecution = copy;
      
    //   // smt simulation
    //   wrongExecution[21].compactStack[0] = '0x0000000000000000000000000000000000000000000000000000000000000fff';
      
    //   // get hashedKey
    //   let key = wrongExecution[21].compactStack[1];
    //   key = HexToBuf(key);
    //   const hashedKey = smt.hash(key);

    //   // get wrong val
    //   let val = wrongExecution[21].compactStack[0];
    //   val = HexToBuf(val);
     
    //   // put wrong val
    //   smt.putData(hashedKey, val);

    //   // get wrong rootHash
    //   const rootHash = smt.root;

    //   wrongExecution[21].storageRoot = rootHash;
    //   wrongExecution[21].storageProof.afterLeaf = smt.hash(val);

    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger manipulate stateRoot at SSTORE 21 in case of reset storage', async () => {
    //   const wrongExecution = copy;
     
    //   // set wrong val
    //    wrongExecution[21].compactStack[0] = '0x0000000000000000000000000000000000000000000000000000000000000fff';
       
    //    // get hashedKey
    //    let key = wrongExecution[21].compactStack[1];
    //    key = HexToBuf(key);
 
    //    const hashedKey = smt.hash(key);
       
    //    // get wrong val
    //    let val = wrongExecution[21].compactStack[0];
    //    val = HexToBuf(val);
      
    //    // put wrong val
    //    smt.putData(hashedKey, val);
 
    //    // get wrong rootHash
    //    const rootHash = smt.root;
       
    //    wrongExecution[21].storageRoot = rootHash;
    //    wrongExecution[21].storageProof.afterLeaf = smt.hash(val);   
    //    const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //    await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solver has an wrong stateProof at first step', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[0].stateRoot = OP.ZERO_HASH;
    //   wrongExecution[0].stateProof.stateRoot = OP.ZERO_HASH;
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong stateProof at first step', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[0].stateRoot = Buffer.alloc(32);
    //   wrongExecution[0].stateProof.stateRoot = Buffer.alloc(32);
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solver has an output error at the first step', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[0].compactStack.push('0x0000000000000000000000000000000000000000000000000000000000000001');
    //   wrongExecution[0].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an output error at the first step', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[0].compactStack.push('0x0000000000000000000000000000000000000000000000000000000000000001');
    //   wrongExecution[0].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solver has an wrong callerKey at SSTORE 5', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[5].stateRoot = Buffer.alloc(32);
    //   wrongExecution[5].storageProof.hashedKey = Buffer.alloc(32);
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong callerKey at SSTORE 5', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[5].stateRoot = Buffer.alloc(32);
    //   wrongExecution[5].storageProof.hashedKey = Buffer.alloc(32);
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solver has an wrong callerAfterLeaf at SSTORE 5', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[5].stateRoot = Buffer.alloc(32);
    //   wrongExecution[5].storageProof.afterLeaf = Buffer.alloc(32);
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong callerAfterLeaf at SSTORE 5', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[5].stateRoot = Buffer.alloc(32);
    //   wrongExecution[5].storageProof.afterLeaf = Buffer.alloc(32);
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solver has an wrong compactStack (storage key) at SSTORE 5', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[5].storageRoot = Buffer.alloc(32);
    //   wrongExecution[5].storageProof.hashedKey = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');
    //   wrongExecution[5].compactStack[1] = '0x0000000000000000000000000000000000000000000000000000000000000001';
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong compactStack (storage key) at SSTORE 5', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[5].storageRoot = Buffer.alloc(32);
    //   wrongExecution[5].storageProof.hashedKey = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');
    //   wrongExecution[5].compactStack[1] = '0x0000000000000000000000000000000000000000000000000000000000000001';     
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solver has an wrong compactStack (storage val) at SSTORE 5', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[5].stateRoot = Buffer.alloc(32);
    //   wrongExecution[5].storageProof.afterLeaf = Buffer.from('0000000000000000000000000000000000000000000000000000000000000fff', 'hex');
    //   wrongExecution[5].compactStack[0] = '0x0000000000000000000000000000000000000000000000000000000000000fff';
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong compactStack (storage val) at SSTORE 5', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[5].stateRoot = Buffer.alloc(32);
    //   wrongExecution[5].storageProof.afterLeaf = Buffer.from('0000000000000000000000000000000000000000000000000000000000000fff', 'hex');
    //   wrongExecution[5].compactStack[0] = '0x0000000000000000000000000000000000000000000000000000000000000fff';      
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    it('solver has an wrong intermediateStateRoot at SSTORE 8', async () => {
      const wrongExecution = copy;
      wrongExecution[8].stateRoot = Buffer.alloc(32);
      wrongExecution[8].storageProof.storageRoot = Buffer.alloc(32);
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger has an wrong intermediateStateRoot at SSTORE 8', async () => {
      const wrongExecution = copy;
      wrongExecution[8].stateRoot = Buffer.alloc(32);
      wrongExecution[8].storageProof.storageRoot = Buffer.alloc(32);
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    // it('solver has an output error at SSTORE', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[5].compactStack.push('0x0000000000000000000000000000000000000000000000000000000000000001');
    //   wrongExecution[5].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an output error at SSTORE', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[5].compactStack.push('0x0000000000000000000000000000000000000000000000000000000000000001');
    //   wrongExecution[5].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

  });
};
