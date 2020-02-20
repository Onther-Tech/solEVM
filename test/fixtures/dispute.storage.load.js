'use strict';

const HydratedRuntime = require('./../../utils/HydratedRuntime');
const Merkelizer = require('../../utils/Merkelizer');
const OP = require('../../utils/constants');
const debug = require('debug')('dispute-test');

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
    const tStorage = ['0xaf63dba574b8df870564c0cfef95996d0bf09a9de28de1e31994eb090e8e7737',
    '0x00000000000000000000000000000000000000000000000000000000000003e8',
    '0x0000000000000000000000000000000000000000000000000000000000000002',
    '0x00000000000000000000000000000000000000000000000000000000000003e8']; 

    const data = '0x00010203040506070809';
    
    let initStorageProof;
    let steps;
    let copy;
    let merkle;
    const runtime = new HydratedRuntime();

    beforeEach(async () => {
      const res = await runtime.run({ code, data, tStorage: tStorage });
      initStorageProof = res[0];
      steps = res[1];
      // console.log(initStorageProof)
      copy = JSON.stringify(steps);
      merkle = new Merkelizer().run(initStorageProof, steps, code, data, tStorage);
    });

    it('challenger has an output error at SSTORE', async () => {
      const wrongExecution = JSON.parse(copy);
      wrongExecution[5].compactStack.push('0x0000000000000000000000000000000000000000000000000000000000000001');
      wrongExecution[5].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const challengerMerkle = new Merkelizer().run(initStorageProof, wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver has an wrong intermediateStorageRoot at SSTORE', async () => {
      const wrongExecution = JSON.parse(copy);
      wrongExecution[5].intermediateStorageRoot = OP.ZERO_HASH;
      const solverMerkle = new Merkelizer().run(initStorageProof, wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger has an wrong intermediateStorageRoot at SSTORE', async () => {
      const wrongExecution = JSON.parse(copy);
      wrongExecution[5].intermediateStorageRoot = OP.ZERO_HASH;
      const challengerMerkle = new Merkelizer().run(initStorageProof, wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver has an output error at SSTORE', async () => {
      const wrongExecution = JSON.parse(copy);
      wrongExecution[5].compactStack.push('0x0000000000000000000000000000000000000000000000000000000000000001');
      wrongExecution[5].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const solverMerkle = new Merkelizer().run(initStorageProof, wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('solver has an output error at first step', async () => {
      const wrongExecution = JSON.parse(copy);
      wrongExecution[0].compactStack.push('0x0000000000000000000000000000000000000000000000000000000000000001');
      wrongExecution[0].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const solverMerkle = new Merkelizer().run(initStorageProof, wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger has an output error at first step', async () => {
      const wrongExecution = JSON.parse(copy);
      wrongExecution[0].compactStack.push('0x0000000000000000000000000000000000000000000000000000000000000001');
      wrongExecution[0].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const challengerMerkle = new Merkelizer().run(initStorageProof, wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver has an wrong intermediateStorageRoot at SSTORE', async () => {
      const wrongExecution = JSON.parse(copy);
      wrongExecution[0].intermediateStorageRoot = OP.ZERO_HASH;
      const solverMerkle = new Merkelizer().run(initStorageProof, wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger has an wrong intermediateStorageRoot at SSTORE', async () => {
      const wrongExecution = JSON.parse(copy);
      wrongExecution[0].intermediateStorageRoot = OP.ZERO_HASH;
      const challengerMerkle = new Merkelizer().run(initStorageProof, wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

  });
};
