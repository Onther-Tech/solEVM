const { getCode, deployContract, deployCode } =
  require('./../helpers/utils');
const fixtures = require('./../fixtures/runtime');
const Runtime = require('./../../utils/EthereumRuntimeAdapter');
const OP = require('./../../utils/constants');

const { PUSH1, BLOCK_GAS_LIMIT } = OP;

const EthereumRuntime = artifacts.require('EthereumRuntimeStorage.sol');

contract('Runtime', function () {
  let rt;

  before(async () => {
    rt = new Runtime(await deployContract(EthereumRuntime));
  });
  
  it('should allow to run a specific number of steps', async () => {
    // codepointers: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, A, B, C
    // execution order: 0, 1, 2, 8, 9, A, B, 3, 4, 5, 6, 7, C
    const code = [
      OP.PUSH1, '03',
      OP.PUSH1, '05',
      // OP.SSTORE,
      // OP.PUSH1, '05',
      // OP.SLOAD,
      // OP.PUSH1, '02',
      // OP.MSTORE,
      // OP.PUSH1, '03',
      // OP.PUSH1, 'ff',
      // OP.PUSH1, '00',
      // OP.MSTORE,
      // OP.PUSH1, '00',
      // OP.MLOAD,
      // OP.PUSH1, '00',
      // OP.MSTORE,
      // OP.PUSH1, 'ff',
      // OP.POP,
      // OP.PUSH1, '00',
      // OP.PUSH1, '01',
      // OP.DUP1,
      // OP.SWAP1,
      // OP.CALLDATASIZE,
      // OP.CALLDATACOPY,
      // OP.GASLIMIT,
      // OP.PUSH1, '01',
      // OP.MSTORE,
      // OP.PUSH1, '00',
      // OP.PUSH1, '01',
      // OP.PUSH1, '00',
      // OP.PUSH1, '01',
      // OP.SHA3,
      // OP.PUSH1, '20',
      // OP.PUSH1, '00',
      // OP.RETURN,
    ];
    const data = '0x';
    const codeContract = await deployCode(code);
    
    const executeStep = async (stepCount) =>
      (await rt.execute(
        {
          code: codeContract.address,
          data: data,
          pc: 0,
          stepCount: stepCount,
        }
      )).hashValue;
    const result = await executeStep(1);
    console.log(result);
  });
  
});
  

  
