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
      OP.PUSH1, '08', OP.JUMP, // jump to 0x08
      OP.JUMPDEST, OP.GASLIMIT, OP.PUSH1, '0C', OP.JUMP, // 0x03. Jump to 0x0c
      OP.JUMPDEST, OP.PUSH1, '03', OP.JUMP, // 0x08. Jump to 0x03
      OP.JUMPDEST, // 0x0c
    ];
    const data = '0x';
    const codeContract = await deployCode(code);
    storage = [0x0000000000000000000000000000000000000000000000000000000000000005,
    0000000000000000000000000000000000000000000000000000000000000003];
    const executeStep = async (stepCount) =>
      (await rt.execute(
        {
          code: codeContract.address,
          data: data,
          pc: 0,
          stepCount: stepCount,
          storage: storage,
        }
      )).pc;
    const result = await executeStep(1);
    console.log(result);
  });
  
});
  

  
