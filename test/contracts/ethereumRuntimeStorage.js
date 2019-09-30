const assert = require('assert');
const fs = require('fs');

const { getCode, deployContract, deployCode } =
  require('./../helpers/utils');
const fixtures = require('./../fixtures/runtimeStorage');
const runtimeGasUsed = require('./../fixtures/runtimeGasUsed');
const Runtime = require('./../../utils/EthereumRuntimeAdapter');
const OP = require('./../../utils/constants');

const { PUSH1, BLOCK_GAS_LIMIT } = OP;

const EthereumRuntime = require('./../../build/contracts/EthereumRuntimeStorage.json');

describe('Runtime', function () {
  let rt;

  before(async () => {
    rt = new Runtime(await deployContract(EthereumRuntime));
  });

  const gasUsedValues = [];
    let totalGasUsed = 0;
    let totalGasUsedBaseline = 0;

    fixtures.forEach(async (fixture, index) => {
      const { code, pc, opcodeUnderTest } = getCode(fixture);
      const testName = fixture.description || opcodeUnderTest;

      it(testName, async () => {
        const stack = fixture.stack || [];
        const mem = fixture.memory || [];
        const data = fixture.data || '0x';
        const gasLimit = fixture.gasLimit || BLOCK_GAS_LIMIT;
        const gasRemaining = typeof fixture.gasRemaining !== 'undefined' ? fixture.gasRemaining : gasLimit;
        const codeContract = await deployCode(code);
        const tStorage = fixture.tStorage || [];
        const logHash = fixture.logHash || OP.ZERO_HASH;
        const args = {
          code: codeContract.address,
          data: data,
          pc: pc,
          gasLimit: gasLimit,
          gasRemaining: gasRemaining,
          stack: stack,
          mem: mem,
          tStorage: tStorage,
          logHash: logHash
        };
        console.log(logHash);
        const res = await rt.execute(args);
        const gasUsed = (await (await rt.execute(args, true)).wait()).gasUsed.toNumber();

        totalGasUsed += gasUsed;
        gasUsedValues[index] = gasUsed;
        console.log(testName, 'gasUsed', gasUsed);

        const gasUsedBaseline = runtimeGasUsed[index];

        if (gasUsedBaseline !== undefined) {
          // The max increase in gas usage
          const maxAllowedDiff = 5000;

          // Skip gas accounting if we do coverage.
          // Ther other hack is for ganache. It has wrong gas accounting with some precompiles 🤦
          if (process.env.COVERAGE || gasUsed >= 0xf810000000000) {
            console.log(
              `Skipping gas accounting for ${testName} because of broken gas accounting (ganache) or coverage`
            );
          } else {
            totalGasUsedBaseline += gasUsedBaseline;

            assert.ok(
              gasUsed <= (gasUsedBaseline + maxAllowedDiff),
              `gasUsed(${gasUsed}) should be not more than baseline(${gasUsedBaseline}) + ${maxAllowedDiff}`
            );
          }
        } else {
          console.log(`*** No gasUsed-baseline for ${testName} ***`);
        }

        if (fixture.result.stack) {
          assert.deepEqual(res.stack, fixture.result.stack, 'stack');
        }
        if (fixture.result.memory) {
          assert.deepEqual(res.mem, fixture.result.memory, 'memory');
        }
        if (fixture.result.pc !== undefined) {
          assert.equal(res.pc.toNumber(), fixture.result.pc, 'pc');
        }
        if (fixture.result.gasUsed !== undefined) {
          assert.equal(gasRemaining - parseInt(res.gas), fixture.result.gasUsed, 'gasUsed');
        }
        if (fixture.result.errno !== undefined) {
          assert.equal(res.errno, fixture.result.errno, 'errno');
        }

        // test for OUT OF GAS
        if (fixture.result.gasUsed !== undefined && fixture.result.gasUsed > 0) {
          const oogArgs = {
            ...args,
            gasRemaining: fixture.result.gasUsed - 1,
          };
          const oogState = await rt.execute(oogArgs);
          // there are 2 cases here:
          //   - out of gas because of the call
          //   - out of gas and cannot make the call
          if ([OP.CALL, OP.STATICCALL, OP.CALLCODE, OP.DELEGATECALL].includes(code[0]) && oogState.errno === 0) {
            assert.equal(oogState.stack[0], 0);
          } else {
            assert.equal(oogState.errno, OP.ERROR_OUT_OF_GAS, 'Not out of gas');
          }
        }

        if (index + 1 === fixtures.length) {
          console.log(`totalGasUsed new: ${totalGasUsed} old: ${totalGasUsedBaseline}`);

          if (totalGasUsed < totalGasUsedBaseline || fixtures.length !== runtimeGasUsed.length) {
            const path = './test/fixtures/runtimeGasUsed.js';

            console.log(`*** New fixtures or low gas usage record. Writing results to ${path}. ***`);
            fs.writeFileSync(path, `'use strict';\nmodule.exports = ${JSON.stringify(gasUsedValues, null, 2)};`);
          }
        }
      });
    });

  
  
});
  

  
