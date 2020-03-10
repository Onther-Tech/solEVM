'use strict';

const HydratedRuntime = require('./../../utils/HydratedRuntime');
const Merkelizer = require('../../utils/Merkelizer');
const OP = require('../../utils/constants');
const debug = require('debug')('dispute-test');
const _ = require('lodash');

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
    const tStorage = [
      '0xaf63dba574b8df870564c0cfef95996d0bf09a9de28de1e31994eb090e8e7737',
      '0x00000000000000000000000000000000000000000000000000000000000003e8',
      '0x0000000000000000000000000000000000000000000000000000000000000002',
      '0x00000000000000000000000000000000000000000000000000000000000003e8'
    ]; 

    const data = '0x00010203040506070809';
    
    let steps;
    let copy;
    let merkle;
    const runtime = new HydratedRuntime();

    beforeEach(async () => {
      steps = await runtime.run({ code, data, tStorage: tStorage });
      copy = _.cloneDeep(steps);
      merkle = new Merkelizer().run(steps, code, data, tStorage);
    });

    it('solver has an wrong intermediateStateProof at first step', async () => {
      const wrongExecution = copy;
      wrongExecution[0].intermediateStateRoot = OP.ZERO_HASH;
      wrongExecution[0].intermediateStateProof.stateRoot = OP.ZERO_HASH;
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    // it('challenger has an wrong intermediateStateProof at first step', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[0].intermediateStateRoot = OP.ZERO_HASH;
    //   wrongExecution[0].intermediateStateProof[0].stateRoot = OP.ZERO_HASH;
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

    // it('solver has an wrong intermediateStorageRoot at SSTORE', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[5].intermediateStorageRoot = OP.ZERO_HASH;
    //   wrongExecution[5].intermediateStorageProof[0].storageRoot = OP.ZERO_HASH;
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong intermediateStorageRoot at SSTORE', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[5].intermediateStorageRoot = OP.ZERO_HASH;
    //   wrongExecution[5].intermediateStorageProof[0].storageRoot = OP.ZERO_HASH;
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

    // it('solver has an wrong intermediateStorageRoot at SSTORE', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[8].intermediateStorageRoot = OP.ZERO_HASH;
    //   wrongExecution[8].intermediateStorageProof[0].storageRoot = OP.ZERO_HASH;
    //   const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    // });

    // it('challenger has an wrong intermediateStorageRoot at SSTORE', async () => {
    //   const wrongExecution = copy;
    //   wrongExecution[8].intermediateStorageRoot = OP.ZERO_HASH;
    //   wrongExecution[8].intermediateStorageProof[0].storageRoot = OP.ZERO_HASH;
    //   const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
    //   await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    // });

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
