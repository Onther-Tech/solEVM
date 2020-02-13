'use strict';

const HydratedRuntime = require('./../../utils/HydratedRuntime');
const Merkelizer = require('../../utils/Merkelizer');
const OP = require('../../utils/constants');
const debug = require('debug')('dispute-test');

const ProofHelper = require('./../../utils/ProofHelper.js');

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
  '0x3e8',
  '0x0000000000000000000000000000000000000000000000000000000000000002',
  '0x3e8'
]; 

const accounts = [
  {
    address: OP.DEFAULT_CONTRACT_ADDRESS,
    code: code,
    tStorage: tStorage
  }
];

const data = '0x00010203040506070809';
let initStorageProof;
let steps;
let copy;
let merkle;
const runtime = new HydratedRuntime();

(async function(){
    const res = await runtime.run({ accounts, code, data, pc: 0, tStorage: tStorage });
    initStorageProof = res[0];
    steps = res[1];

    // console.log(steps, steps.length);

    merkle = await new Merkelizer().run(initStorageProof, steps, code, data, tStorage);
    //console.log(merkle.printTree());
    
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].opCodeName === 'SLOAD' || steps[i].opCodeName === 'SSTORE') { 
        console.log(steps[i])
        const step = merkle.tree[0][i];
        console.log(step)
        const args = ProofHelper.constructProof(step);
        console.log(args)
      }
    }
    
    
   
})();