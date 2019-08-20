'use strict';

const HydratedRuntime = require('./../../utils/HydratedRuntime');
const Merkelizer = require('../../utils/Merkelizer');
const OP = require('../../utils/constants');
const debug = require('debug')('dispute-test');

module.exports = (callback) => {
  describe('Fixture for Dispute/Verifier Logic #1', function () {
    // let code = '6080604052348015600f57600080fd5b5060043610604f576000357c0100000000000000000000000000000000000000000000000000000000900480630dbe671f14605457806360fe47b1146070575b600080fd5b605a609b565b6040518082815260200191505060405180910390f35b609960048036036020811015608457600080fd5b810190808035906020019092919050505060a1565b005b60005481565b806000819055505056fea165627a7a72305820214b5d23928836ddfeda9b10c5f9b9c7f4ae8409622de05d1a14d4288610009e0029';
    // const data = '0x0dbe671f';
    //let code = '608060405234801561001057600080fd5b50600436106100a5576000357c01000000000000000000000000000000000000000000000000000000009004806370a082311161007857806370a082311461021a578063a457c2d714610272578063a9059cbb146102d8578063dd62ed3e1461033e576100a5565b8063095ea7b3146100aa57806318160ddd1461011057806323b872dd1461012e57806339509351146101b4575b600080fd5b6100f6600480360360408110156100c057600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506103b6565b604051808215151515815260200191505060405180910390f35b6101186103cd565b6040518082815260200191505060405180910390f35b61019a6004803603606081101561014457600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506103d7565b604051808215151515815260200191505060405180910390f35b610200600480360360408110156101ca57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506104a3565b604051808215151515815260200191505060405180910390f35b61025c6004803603602081101561023057600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610548565b6040518082815260200191505060405180910390f35b6102be6004803603604081101561028857600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610590565b604051808215151515815260200191505060405180910390f35b610324600480360360408110156102ee57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610650565b604051808215151515815260200191505060405180910390f35b6103a06004803603604081101561035457600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610667565b6040518082815260200191505060405180910390f35b60006103c33384846106ee565b6001905092915050565b6000600254905090565b60006103e48484846108e9565b61049884336104938560606040519081016040528060288152602001610d5c60289139600160008b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054610ba49092919063ffffffff16565b6106ee565b600190509392505050565b600061053e338461053985600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008973ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054610c6690919063ffffffff16565b6106ee565b6001905092915050565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b600061064633846106418560606040519081016040528060258152602001610dcd60259139600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008a73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054610ba49092919063ffffffff16565b6106ee565b6001905092915050565b600061065d3384846108e9565b6001905092915050565b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614151515610776576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526024815260200180610da96024913960400191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16141515156107fe576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526022815260200180610d146022913960400191505060405180910390fd5b80600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925836040518082815260200191505060405180910390a3505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614151515610971576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526025815260200180610d846025913960400191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16141515156109f9576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526023815260200180610cf16023913960400191505060405180910390fd5b610a658160606040519081016040528060268152602001610d36602691396000808773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054610ba49092919063ffffffff16565b6000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550610af8816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054610c6690919063ffffffff16565b6000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040518082815260200191505060405180910390a3505050565b60008383111582901515610c53576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b83811015610c18578082015181840152602081019050610bfd565b50505050905090810190601f168015610c455780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b5060008385039050809150509392505050565b6000808284019050838110151515610ce6576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601b8152602001807f536166654d6174683a206164646974696f6e206f766572666c6f77000000000081525060200191505060405180910390fd5b809150509291505056fe45524332303a207472616e7366657220746f20746865207a65726f206164647265737345524332303a20617070726f766520746f20746865207a65726f206164647265737345524332303a207472616e7366657220616d6f756e7420657863656564732062616c616e636545524332303a207472616e7366657220616d6f756e74206578636565647320616c6c6f77616e636545524332303a207472616e736665722066726f6d20746865207a65726f206164647265737345524332303a20617070726f76652066726f6d20746865207a65726f206164647265737345524332303a2064656372656173656420616c6c6f77616e63652062656c6f77207a65726fa165627a7a7230582041e5f67b6e9557bb6c8c314ea6a19da29de0c0101bbb8d7181d69d05e40c6bc30029'
    // let code = [
    //   OP.PUSH1, '80',
    //   OP.PUSH1, '40',
    //   OP.MSTORE,
    //   OP.CALLVALUE,
    //   OP.DUP1,
    //   OP.ISZERO,
    //   OP.PUSH1, '0f',
    //   OP.JUMPI, 
    //   OP.PUSH1, '00',
    //   OP.DUP1, 
    //   OP.REVERT,
    //   OP.JUMPDEST,
    //   OP.POP,
    //   OP.PUSH1, '04',
    //   OP.CALLDATASIZE,
    //   OP.LT,
    //   OP.PUSH1, '4f',
    //   OP.JUMPI,
    //   OP.PUSH1, '00',
    //   OP.CALLDATALOAD,
    //   OP.PUSH29, '0100000000000000000000000000000000000000000000000000000000',
    //   OP.SWAP1,
    //   OP.DIV,
    //   OP.DUP1,
    //   OP.PUSH4, '0dbe671f',
    //   OP.EQ,
    //   OP.PUSH1, '54',
    //   OP.JUMPI,
    //   OP.DUP1,
    //   OP.PUSH4, '60fe47b1',
    //   OP.EQ,
    //   OP.PUSH1, '70',
    //   OP.JUMPI,
    //   OP.JUMPDEST,
    //   OP.PUSH1, '00',
    //   OP.DUP1,
    //   OP.REVERT,
    //   OP.JUMPDEST,
    //   OP.PUSH1, '5a',
    //   OP.PUSH1, '9b',
    //   OP.JUMP,
    //   OP.JUMPDEST,
    //   OP.PUSH1, '40',
    //   OP.MLOAD,
    //   OP.DUP1,
    //   OP.DUP3,
    //   OP.DUP2,
    //   OP.MSTORE,
    //   OP.PUSH1, '20',
    //   OP.ADD,
    //   OP.SWAP2,
    //   OP.POP,
    //   OP.POP,
    //   OP.PUSH1, '40',
    //   OP.MLOAD,
    //   OP.DUP1,
    //   OP.SWAP2,
    //   OP.SUB,
    //   OP.SWAP1,
    //   OP.RETURN,
    //   OP.JUMPDEST,
    //   OP.PUSH1, '99',
    //   OP.PUSH1, '04',
    //   OP.DUP1,
    //   OP.CALLDATASIZE,
    //   OP.SUB,
    //   OP.PUSH1, '20',
    //   OP.DUP2, 
    //   OP.LT,
    //   OP.ISZERO,
    //   OP.PUSH1, '84',
    //   OP.JUMPI,
    //   OP.PUSH1, '00',
    //   OP.DUP1,
    //   OP.REVERT,
    //   OP.JUMPDEST,
    //   OP.DUP2,
    //   OP.ADD,
    //   OP.SWAP1,
    //   OP.DUP1,
    //   OP.DUP1,
    //   OP.CALLDATALOAD,
    //   OP.SWAP1,
    //   OP.PUSH1, '20',
    //   OP.ADD,
    //   OP.SWAP1,
    //   OP.SWAP3,
    //   OP.SWAP2,
    //   OP.SWAP1,
    //   OP.POP,
    //   OP.POP,
    //   OP.POP,
    //   OP.PUSH1, 'a1',
    //   OP.JUMP,
    //   OP.JUMPDEST,
    //   OP.STOP,
    //   OP.JUMPDEST,
    //   OP.PUSH1, '00',
    //   OP.SLOAD,
    //   OP.DUP2,
    //   OP.JUMP,
    //   OP.JUMPDEST,
    //   OP.DUP1,
    //   OP.PUSH1, '00',
    //   OP.DUP2,
    //   OP.SWAP1,
    //   OP.SSTORE,
    //   OP.POP,
    //   OP.POP,
    //   OP.JUMP,
    //   OP.INVALID,
    //   OP.LOG1,
    //   OP.PUSH6, '627a7a723058',
    //   OP.SHA3,
    //   OP.INVALID,
    //   OP.INVALID,
    //   OP.INVALID,
    //   OP.INVALID,
    //   OP.SWAP3,
    //   OP.DUP9,
    //   OP.CALLDATASIZE,
    //   OP.INVALID,
    //   OP.INVALID,
    //   OP.INVALID,
    //   OP.SWAP12,
    //   OP.LT,
    //   OP.INVALID,
    //   OP.INVALID,
    //   OP.INVALID,
    //   OP.INVALID,
    //   OP.DELEGATECALL,
    //   OP.INVALID,
    //   OP.DUP5,
    //   OP.MULMOD,
    //   OP.PUSH3, '2de05d',
    //   OP.BYTE,
    //   OP.EQ,
    //   OP.INVALID,
    //   OP.INVALID,
    //   OP.DUP7,
    //   OP.LT,
    //   OP.STOP,
    //   OP.SWAP15,
    //   OP.STOP,
    //   OP.INVALID
    // ];
    // const data = '0x0dbe671f';

    const stack = [  
      '0x0000000000000000000000000000000000000000000000000000000070a08231',
      '0x0000000000000000000000000000000000000000000000000000000000000280',
      '0x000000000000000000000000ca35b7d915458ef540ade6068dfe2f44e8fa733c',
    ];
    const mem = [
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000000000000000000000000080',
    ];
    const tStorage = [
      '0xaf63dba574b8df870564c0cfef95996d0bf09a9de28de1e31994eb090e8e7737',
      '0x00000000000000000000000000000000000000000000000000000000000003e8'
    ];
    //const data = '0x70a08231000000000000000000000000ca35b7d915458ef540ade6068dfe2f44e8fa733c';
    
    const code = [
      OP.PUSH1, '03',
      OP.PUSH1, '05',
      OP.ADD,
      OP.PUSH1, 'ff',
      OP.PUSH1, '00',
      OP.SSTORE,
      OP.PUSH1, 'ff',
      OP.PUSH1, '00',
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
    const data = '0x00010203040506070809';

    let steps;
    let copy;
    let merkle;
    const runtime = new HydratedRuntime();

    beforeEach(async () => {
      steps = await runtime.run({ code, data });
      copy = JSON.stringify(steps);
      merkle = new Merkelizer().run(steps, code, data);
    });

    it('both have the same result, solver wins', async () => {
      await callback(code, data, merkle, merkle, 'solver');
    });

    it('challenger has an output error somewhere', async () => {
      const wrongExecution = JSON.parse(copy);
      wrongExecution[6].compactStack.push('0x0000000000000000000000000000000000000000000000000000000000000001');
      wrongExecution[6].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data);
      await callback(code, data, merkle, challengerMerkle, 'solver');
    });

    it('solver has an output error somewhere', async () => {
      const wrongExecution = JSON.parse(copy);
      wrongExecution[6].compactStack.push('0x0000000000000000000000000000000000000000000000000000000000000001');
      wrongExecution[6].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data);
      await callback(code, data, solverMerkle, merkle, 'challenger');
    });

    it('challenger first step missing', async () => {
      const wrongExecution = JSON.parse(copy);
      wrongExecution.shift();
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data);
      await callback(code, data, merkle, challengerMerkle, 'solver');
    });

    it('solver first step missing', async () => {
      const wrongExecution = JSON.parse(copy);
      wrongExecution.shift();
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data);
      await callback(code, data, solverMerkle, merkle, 'challenger');
    });

    it('challenger last step gone', async () => {
      const wrongExecution = JSON.parse(copy);
      wrongExecution.pop();
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data);
      await callback(code, data, merkle, challengerMerkle, 'solver');
    });

    it('solver last step gone', async () => {
      const wrongExecution = JSON.parse(copy);
      wrongExecution.pop();
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data);
      await callback(code, data, solverMerkle, merkle, 'challenger');
    });

    it('challenger wrong memory output', async () => {
      const wrongExecution = JSON.parse(copy);
      for (let i = 1; i < wrongExecution.length; i += 2) {
        wrongExecution[i].mem.push('0x0000000000000000000000000000000000000000000000000000000000000000');
      }
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data);
      await callback(code, data, merkle, challengerMerkle, 'solver');
    });

    it('solver wrong memory output', async () => {
      const wrongExecution = JSON.parse(copy);
      for (let i = 1; i < wrongExecution.length; i += 2) {
        wrongExecution[i].mem.push('0x0000000000000000000000000000000000000000000000000000000000000000');
      }
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data);
      await callback(code, data, solverMerkle, merkle, 'challenger');
    });

    it('challenger wrong stack output', async () => {
      const wrongExecution = JSON.parse(copy);
      for (let i = 1; i < wrongExecution.length; i += 2) {
        wrongExecution[i].compactStack.push('0x0000000000000000000000000000000000000000000000000000000000000000');
        wrongExecution[i].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
      }
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data);
      await callback(code, data, merkle, challengerMerkle, 'solver');
    });

    it('solver wrong stack output', async () => {
      const wrongExecution = JSON.parse(copy);
      for (let i = 1; i < wrongExecution.length; i += 2) {
        wrongExecution[i].compactStack.push('0x0000000000000000000000000000000000000000000000000000000000000000');
        wrongExecution[i].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
      }
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data);
      await callback(code, data, solverMerkle, merkle, 'challenger');
    });

    it('challenger wrong opcode', async () => {
      const wrongExecution = JSON.parse(copy);
      for (let i = 1; i < wrongExecution.length; i += 3) {
        wrongExecution[i].code = ['01'];
        wrongExecution[i].pc += 1;
      }
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data);
      await callback(code, data, merkle, challengerMerkle, 'solver');
    });

    it('solver wrong opcode', async () => {
      const wrongExecution = JSON.parse(copy);
      for (let i = 1; i < wrongExecution.length; i += 3) {
        wrongExecution[i].code = ['01'];
        wrongExecution[i].pc += 1;
      }
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data);
      await callback(code, data, solverMerkle, merkle, 'challenger');
    });

    it('only two steps, both wrong but doesn\'t end with OP.REVERT or RETURN = challenger wins', async () => {
      const wrongExecution = JSON.parse(copy).slice(0, 2);
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data);
      await callback(code, data, solverMerkle, merkle, 'challenger');
    });

    it('solver misses steps in between', async () => {
      let wrongExecution = JSON.parse(copy);
      wrongExecution = wrongExecution.slice(0, 2).concat(wrongExecution.slice(-3));
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data);
      await callback(code, data, solverMerkle, merkle, 'challenger');
    });

    it('solver with one invalid step', async () => {
      const wrongExecution = JSON.parse(copy);
      wrongExecution[7] = wrongExecution[8];
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data);
      await callback(code, data, solverMerkle, merkle, 'challenger');
    });

    it('challenger with one invalid step', async () => {
      const wrongExecution = JSON.parse(copy);
      wrongExecution[7] = wrongExecution[8];
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data);
      await callback(code, data, merkle, challengerMerkle, 'solver');
    });
  });

  // describe('Fixture for Dispute/Verifier Logic #2 (JUMP)', function () {
  //   const code = [
  //     OP.PUSH1, '08', OP.JUMP, // jump to 0x08
  //     OP.JUMPDEST, OP.GAS, OP.PUSH1, '0C', OP.JUMP, // 0x03. Jump to 0x0c
  //     OP.JUMPDEST, OP.PUSH1, '03', OP.JUMP, // 0x08. Jump to 0x03
  //     OP.JUMPDEST, // 0x0c
  //     OP.PUSH1, '00',
  //     OP.OP.DUP1,
  //     OP.OP.REVERT,
  //   ];
  //   const data = '0x';
  //   let steps;
  //   let copy;
  //   let merkle;
  //   const runtime = new HydratedRuntime();

  //   before(async () => {
  //     steps = await runtime.run({ code });
  //     copy = JSON.stringify(steps);
  //     merkle = new Merkelizer().run(steps, code, data);
  //   });

  //   it('both have the same result, solver wins', async () => {
  //     await callback(code, data, merkle, merkle, 'solver');
  //   });

  //   it('solver last step gone', async () => {
  //     const wrongExecution = JSON.parse(copy);
  //     wrongExecution.pop();
  //     const solverMerkle = new Merkelizer().run(wrongExecution, code, data);
  //     await callback(code, data, solverMerkle, merkle, 'challenger');
  //   });

  //   it('solver wrong JUMP', async () => {
  //     const wrongExecution = JSON.parse(copy);
  //     wrongExecution[1].pc = 0xfff;
  //     const solverMerkle = new Merkelizer().run(wrongExecution, code, data);
  //     await callback(code, data, solverMerkle, merkle, 'challenger');
  //   });
  // });

  // describe('solver messing with tree', function () {
  //   const code = [
  //     OP.PUSH1, '01',
  //     OP.PUSH1, '02',
  //     OP.PUSH1, '03',
  //     OP.PUSH1, '03',
  //     OP.PUSH1, '03',
  //     OP.PUSH1, '03',
  //     OP.PUSH1, '03',
  //     OP.PUSH1, '03',
  //     OP.PUSH1, '03',
  //     OP.PUSH1, '03',
  //     OP.PUSH1, '03',
  //     OP.PUSH1, '03',
  //     OP.PUSH1, '03',
  //     OP.PUSH1, '03',
  //     OP.PUSH1, '03',
  //     OP.PUSH1, '03',
  //     OP.PUSH1, '03',
  //     OP.PUSH1, '03',
  //     OP.PUSH1, '03',
  //     OP.PUSH1, '03',
  //     OP.PUSH1, '03',
  //     OP.PUSH1, '03',
  //     OP.RETURN,
  //   ];

  //   const data = '0x';
  //   let steps;
  //   const runtime = new HydratedRuntime();
  //   let challengerMerkle;
  //   let leaves;

  //   beforeEach(async () => {
  //     steps = await runtime.run({ code });
  //     challengerMerkle = new Merkelizer().run(steps, code, data);
  //     leaves = JSON.stringify(challengerMerkle.tree[0]);
  //   });

  //   it('copy last leaf to previous leaf #1', async () => {
  //     const solverMerkle = new Merkelizer();

  //     solverMerkle.tree[0] = JSON.parse(leaves);
  //     solverMerkle.tree[0][2] = solverMerkle.tree[0][3];
  //     solverMerkle.recal(0);
  //     debug('Solver', solverMerkle.printTree());
  //     debug('Challenger', challengerMerkle.printTree());
  //     await callback(code, data, solverMerkle, challengerMerkle, 'challenger');
  //   });

  //   it('copy last leaf to previous leaf #2', async () => {
  //     const solverMerkle = new Merkelizer();

  //     solverMerkle.tree[0] = JSON.parse(leaves);
  //     solverMerkle.tree[0][1] = solverMerkle.tree[0][2];
  //     solverMerkle.recal(0);
  //     debug('Solver', solverMerkle.printTree());
  //     debug('Challenger', challengerMerkle.printTree());
  //     await callback(code, data, solverMerkle, challengerMerkle, 'challenger');
  //   });

  //   it('copy last leaf to previous leaf #3', async () => {
  //     const solverMerkle = new Merkelizer();

  //     solverMerkle.tree[0] = JSON.parse(leaves);
  //     solverMerkle.tree[0][19] = solverMerkle.tree[0][20];
  //     solverMerkle.recal(0);
  //     debug('Solver', solverMerkle.printTree());
  //     debug('Challenger', challengerMerkle.printTree());
  //     await callback(code, data, solverMerkle, challengerMerkle, 'challenger');
  //   });

  //   it('copy last leaf to previous leaf #4', async () => {
  //     const solverMerkle = new Merkelizer();

  //     solverMerkle.tree[0] = JSON.parse(leaves);
  //     solverMerkle.tree[0][18] = solverMerkle.tree[0][19];
  //     solverMerkle.recal(0);
  //     debug('Solver', solverMerkle.printTree());
  //     debug('Challenger', challengerMerkle.printTree());
  //     await callback(code, data, solverMerkle, challengerMerkle, 'challenger');
  //   });

  //   it('challenger: copy last leaf to previous leaf #1', async () => {
  //     const challengerMerkle = new Merkelizer();
  //     const solverMerkle = new Merkelizer();

  //     solverMerkle.tree[0] = JSON.parse(leaves);
  //     solverMerkle.recal(0);

  //     challengerMerkle.tree[0] = JSON.parse(leaves);
  //     challengerMerkle.tree[0][18] = solverMerkle.tree[0][19];
  //     challengerMerkle.recal(0);
  //     debug('Solver', solverMerkle.printTree());
  //     debug('Challenger', challengerMerkle.printTree());
  //     await callback(code, data, solverMerkle, challengerMerkle, 'solver');
  //   });

  //   it('copy last leaf to previous leaf, change last leaf to zero', async () => {
  //     const solverMerkle = new Merkelizer();

  //     solverMerkle.tree[0] = JSON.parse(leaves);
  //     solverMerkle.tree[0][2] = solverMerkle.tree[0][3];
  //     solverMerkle.tree[0][3] = Merkelizer.zero();
  //     solverMerkle.recal(0);
  //     debug('Solver', solverMerkle.printTree());
  //     debug('Challenger', challengerMerkle.printTree());
  //     await callback(code, data, solverMerkle, challengerMerkle, 'challenger');
  //   });

  //   for (let i = 1; i < 23; i++) {
  //     it(`challenger fake tree[${i}]`, async () => {
  //       const solverMerkle = new Merkelizer().run(steps, code, data);
  //       const challengerMerkle = new Merkelizer().run(steps, code, data);

  //       challengerMerkle.tree[0][i] = challengerMerkle.tree[0][i + 1];
  //       challengerMerkle.recal(0);

  //       debug('Solver', solverMerkle.printTree());
  //       debug('Challenger', challengerMerkle.printTree());
  //       await callback(code, data, solverMerkle, challengerMerkle, 'solver');
  //     });
  //   }
  // });

  // describe('Fixture for Dispute/Verifier Logic #3', function () {
  //   const code = [
  //     OP.PUSH2, 'ffff',
  //     OP.PUSH1, '31',
  //     OP.MSTORE,
  //     OP.PUSH1, 'f0',
  //     OP.MLOAD,
  //     // TODO: this asserts(BN) in ethereumjs-vm
  //     // OP.PUSH4, 'ffffffff',
  //     // OP.PUSH2, 'ffff',
  //     // OP.PUSH3, 'ffffff',
  //     OP.PUSH1, 'ff',
  //     OP.PUSH1, '00',
  //     OP.PUSH1, '00',
  //     OP.CALLDATACOPY,
  //     OP.PUSH1, '20',
  //     OP.PUSH1, '00',
  //     OP.RETURN,
  //   ];
  //   const data = '0x00010203040506070809';

  //   let steps;
  //   let copy;
  //   let merkle;
  //   const runtime = new HydratedRuntime();

  //   before(async () => {
  //     steps = await runtime.run({ code, data });
  //     copy = JSON.stringify(steps);
  //     merkle = new Merkelizer().run(steps, code, data);
  //   });

  //   it('both have the same result, solver wins', async () => {
  //     await callback(code, data, merkle, merkle, 'solver');
  //   });

  //   it('challenger wrong memory output #1', async () => {
  //     const wrongExecution = JSON.parse(copy);
  //     wrongExecution[2].mem.push('0x0000000000000000000000000000000000000000000000000000000000000000');
  //     const challengerMerkle = new Merkelizer().run(wrongExecution, code, data);
  //     await callback(code, data, merkle, challengerMerkle, 'solver');
  //   });

  //   it('solver wrong memory output #1', async () => {
  //     const wrongExecution = JSON.parse(copy);
  //     wrongExecution[2].mem.push('0x0000000000000000000000000000000000000000000000000000000000000000');
  //     const solverMerkle = new Merkelizer().run(wrongExecution, code, data);
  //     await callback(code, data, solverMerkle, merkle, 'challenger');
  //   });

  //   it('challenger wrong memory output #2', async () => {
  //     const wrongExecution = JSON.parse(copy);
  //     wrongExecution[4].mem.push('0x0000000000000000000000000000000000000000000000000000000000000000');
  //     const challengerMerkle = new Merkelizer().run(wrongExecution, code, data);
  //     await callback(code, data, merkle, challengerMerkle, 'solver');
  //   });

  //   it('solver wrong memory output #2', async () => {
  //     const wrongExecution = JSON.parse(copy);
  //     wrongExecution[4].mem.push('0x0000000000000000000000000000000000000000000000000000000000000000');
  //     const solverMerkle = new Merkelizer().run(wrongExecution, code, data);
  //     await callback(code, data, solverMerkle, merkle, 'challenger');
  //   });

  //   it('solver wrong memory output #3 - calldata', async () => {
  //     const wrongExecution = JSON.parse(copy);
  //     wrongExecution[8].mem.push('0x0000000000000000000000000000000000000000000000000000000000000000');
  //     const solverMerkle = new Merkelizer().run(wrongExecution, code, data);
  //     await callback(code, data, solverMerkle, merkle, 'challenger');
  //   });

  //   it('challenger wrong execution tree', async () => {
  //     const wrongExecution = JSON.parse(copy);
  //     wrongExecution.push(wrongExecution[4]);
  //     wrongExecution.push(wrongExecution[5]);
  //     wrongExecution.push(wrongExecution[6]);
  //     wrongExecution.push(wrongExecution[7]);
  //     const challengerMerkle = new Merkelizer().run(wrongExecution, code, data);
  //     await callback(code, data, merkle, challengerMerkle, 'solver');
  //   });
  // });

  // describe('Fixture for Dispute/Verifier Logic #4', function () {
  //   this.timeout(55550);

  //   const code = [
  //     OP.PUSH3, 'a1a1a1',
  //     OP.PUSH3, 'ffffff',
  //     OP.MSTORE,
  //     OP.PUSH1, 'f0',
  //     OP.MLOAD,
  //     OP.PUSH1, '20',
  //     OP.PUSH1, '00',
  //     OP.RETURN,
  //   ];
  //   const data = '0x';

  //   let steps;
  //   let merkle;
  //   const runtime = new HydratedRuntime();

  //   before(async () => {
  //     steps = await runtime.run({ code, data });
  //     merkle = new Merkelizer().run(steps, code, data);
  //   });

  //   it('both have the same result, solver looses because of overcommit on memory', async () => {
  //     await callback(code, data, merkle, merkle, 'challenger');
  //   });
  // });

  // describe('Fixture for Dispute/Verifier Logic #5 - CODECOPY', function () {
  //   this.timeout(55550);

  //   const code = [
  //     OP.PUSH2, '00ff',
  //     OP.PUSH1, '03',
  //     OP.PUSH1, '01',
  //     OP.CODECOPY,
  //     OP.PUSH1, '20',
  //     OP.PUSH1, '00',
  //     OP.RETURN,
  //   ];
  //   const data = '0x';

  //   let steps;
  //   let merkle;
  //   let copy;
  //   const runtime = new HydratedRuntime();

  //   before(async () => {
  //     steps = await runtime.run({ code, data });
  //     copy = JSON.stringify(steps);
  //     merkle = new Merkelizer().run(steps, code, data);
  //   });

  //   it('Solver wins', async () => {
  //     const wrongExecution = JSON.parse(copy);
  //     wrongExecution[3].pc = 0xfa;
  //     const challengerMerkle = new Merkelizer().run(wrongExecution, code, data);

  //     await callback(code, data, merkle, challengerMerkle, 'solver');
  //   });
  // });

  // describe('Fixture for Dispute/Verifier Logic #6 - CODECOPY', function () {
  //   this.timeout(55550);

  //   const code = [
  //     OP.PUSH2, '00ff',
  //     OP.PUSH1, 'ff',
  //     OP.PUSH1, '01',
  //     OP.CODECOPY,
  //     OP.PUSH1, '20',
  //     OP.PUSH1, '00',
  //     OP.RETURN,
  //   ];
  //   const data = '0x';

  //   let steps;
  //   let merkle;
  //   let copy;
  //   const runtime = new HydratedRuntime();

  //   before(async () => {
  //     steps = await runtime.run({ code, data });
  //     copy = JSON.stringify(steps);
  //     merkle = new Merkelizer().run(steps, code, data);
  //   });

  //   it('Challenger wins', async () => {
  //     const wrongExecution = JSON.parse(copy);
  //     wrongExecution[3].pc = 0xfa;
  //     const solverMerkle = new Merkelizer().run(wrongExecution, code, data);

  //     await callback(code, data, solverMerkle, merkle, 'challenger');
  //   });
  // });

  // describe('Fixture for Dispute/Verifier Logic #7 - stack underflow', function () {
  //   const code = [
  //     OP.CODECOPY,
  //     OP.RETURN,
  //   ];
  //   const data = '0x';

  //   let steps;
  //   let merkle;
  //   const runtime = new HydratedRuntime();

  //   before(async () => {
  //     steps = await runtime.run({ code, data });
  //     merkle = new Merkelizer().run(steps, code, data);
  //   });

  //   it('Challenger wins', async () => {
  //     await callback(code, data, merkle, merkle, 'challenger');
  //   });
  // });

  // describe('Fixture for Dispute/Verifier Logic #8 - unsupported opcode', function () {
  //   const code = [
  //     OP.PUSH1, '33',
  //     OP.GAS,
  //     OP.PUSH1, '00',
  //     OP.RETURN,
  //   ];
  //   const data = '0x';

  //   let steps;
  //   let merkle;
  //   let copy;
  //   const runtime = new HydratedRuntime();

  //   before(async () => {
  //     steps = await runtime.run({ code, data });
  //     copy = JSON.stringify(steps);
  //     merkle = new Merkelizer().run(steps, code, data);
  //     code[2] = OP.SLOAD;
  //   });

  //   it('Challenger wins', async () => {
  //     // this should point to OP.GAS which we replaced with OP.SLOAD
  //     const wrongExecution = JSON.parse(copy);
  //     wrongExecution[1].gasRemaining = 0xffff;
  //     const solverMerkle = new Merkelizer().run(wrongExecution, code, data);

  //     await callback(code, data, solverMerkle, merkle, 'challenger');
  //   });
  // });
  // describe('Fixture for Dispute/Verifier Logic #4', function () {
  //   let code = [];

  //   for (let i = 0; i < 1500; i++){
  //     code.push(OP.PUSH1);
  //     code.push('08');
  //   }

  //   const data = '0xa9059cbb00000000000000000000000014723a09acff6d2a60dcdf7aa4aff308fddc160c00000000000000000000000000000000000000000000000000000000000001f4';

  //   let steps;
  //   let merkle;
  //   const stepper = new OffchainStepper();

  //   before(async () => {
  //     steps = await stepper.run({ code, data });
  //     merkle = new Merkelizer().run(steps, code, data);
  //   });

  //   it('both have the same result, solver looses because of overcommit on memory', async () => {
  //     await callback(code, data, merkle, merkle, 'challenger');
  //   });
  // });
};
