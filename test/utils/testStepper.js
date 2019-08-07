const OffchainStepper = require('../../utils/OffchainStepperStorage');
const Merkelizer = require('../../utils/MerkelizerStorage');
const OP = require('../../utils/constants');

const code = [
  OP.PUSH1, '03',
  OP.PUSH1, '05',
  OP.ADD,
  OP.PUSH1, 'ff',
  OP.PUSH1, '00',
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
  OP.GASLIMIT,
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

// const code = [
//     OP.PUSH1, '08', OP.JUMP, // jump to 0x08
//     OP.JUMPDEST, OP.GASLIMIT, OP.PUSH1, '0C', OP.JUMP, // 0x03. Jump to 0x0c
//     OP.JUMPDEST, OP.PUSH1, '03', OP.JUMP, // 0x08. Jump to 0x03
//     OP.JUMPDEST, // 0x0c
//     OP.PUSH1, '00',
//     OP.DUP1,
//     OP.REVERT,
//   ];
//   const data = '0x';

  let steps;
  let copy;
  const stepper = new OffchainStepper();

(async function(){
    steps = await stepper.run({ code, data });
    console.log(steps)
    const solverMerkle = await new Merkelizer().run(steps, code, data);
    console.log(solverMerkle.printTree());

    
})();