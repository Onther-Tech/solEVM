'use strict';

const ethers = require('ethers');
const debug = require('debug')('vgame-test');
const assert = require('assert');

const { Merkelizer, ExecutionPoker, Constants, FragmentTree } = require('./../../utils');
const disputeFixtures = require('./../fixtures/dispute.create2.value');
const { onchainWait, deployContract, deployCode, wallets, provider } = require('./../helpers/utils');

const Verifier = require('./../../build/contracts/VerifierStorage.json');
const Enforcer = require('./../../build/contracts/EnforcerStorage.json');
const SOLVER_VERIFIED = (1 << 2);

const EVMParameters = {
  origin: '0xa1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1',
  target: '0xfeefeefeefeefeefeefeefeefeefeefeefeefee0',
  blockHash: '0xdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdc',
  blockNumber: 123,
  time: 1560775755,
  txGasLimit: 0xffffffffff,
  codeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  dataHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  storageRoot: '0xa7ff9e28ffd3def443d324547688c2c4eb98edf7da757d6bfa22bff55b9ce24a',
  stateRoot: '0x8c904a6c4dd003034192db129530f2be76fc582718ed26d406901f43883d8559',
  runtimeStackHash: '0x3599abd986d613e6fd30c2a96672d3d7042ad6789ad127a562b1d03f9ed21075',
  accountHash: '0xb58ef434654f1ed6cf316edc9edf18ba1ae95c97f96f1125d6792555ce96d70a'
};

class MyExecutionPoker extends ExecutionPoker {
  async submitRound (disputeId) {
    try {
      await super.submitRound(disputeId);
    } catch (e) {
      // ignore
    }
  }

  async submitProof (disputeId, computationPath) {
    try {
      await super.submitProof(disputeId, computationPath);
    } catch (e) {
      // ignore
    }

    this.afterSubmitProof(disputeId);
  }

  async computeCall (evmParams, invalidateLastStep) {
    return { steps: this._steps, merkle: this._merkle, codeFragmentTree: this._codeFragmentTree };
  }

  async requestExecution (code, callData, tStorage, doDeployCode) {
    EVMParameters.blockNumber++;

    let codeHash;

    if (doDeployCode) {
      const codeContract = await deployCode(code);
      codeHash = `0x${codeContract.address.replace('0x', '').toLowerCase().padEnd(64, '0')}`;
    } else {
      this._codeFragmentTree = new FragmentTree().run(code);
      codeHash = this._codeFragmentTree.root.hash;
    }

    const dataHash = Merkelizer.dataHash(callData);
    const evmParams = Object.assign(EVMParameters, { codeHash, dataHash });

    return super.requestExecution(evmParams, callData);
  }

  log (...args) {
    debug(...args);
  }
}

async function doGame ({ verifier, code, callData, tStorage, execPokerSolver, execPokerChallenger, doDeployCode }) {
  return new Promise(
    (resolve, reject) => {
      let resolved = false;
      let state = 0;

      async function decide (disputeId) {
        state++;
        if (state !== 2) {
          return;
        }

        const dispute = await verifier.disputes(disputeId);
        let winner = 'challenger';
        if ((dispute.state & SOLVER_VERIFIED) !== 0) {
          winner = 'solver';
        }
        if (!resolved) {
          resolved = true;
          resolve(winner);
        }
      }

      execPokerSolver.afterSubmitProof = async (disputeId) => {
        decide(disputeId);
      };
      execPokerChallenger.afterSubmitProof = async (disputeId) => {
        decide(disputeId);
      };
      execPokerSolver.onSlashed = () => {
        if (!resolved) {
          resolved = true;
          resolve('challenger');
        }
      };
      execPokerChallenger.onSlashed = () => {
        if (!resolved) {
          resolved = true;
          resolve('solver');
        }
      };

      execPokerSolver.requestExecution(code, callData, tStorage, doDeployCode);
    }
  );
}

describe('Verifier', function () {
  let enforcer;
  let verifier;
  let execPokerSolver;
  let execPokerChallenger;

  before(async () => {
    const taskPeriod = 1000000;
    const challengePeriod = 1000;
    const timeoutDuration = 50;
    const bondAmount = 1;
    const maxExecutionDepth = 15;

    verifier = await deployContract(Verifier, timeoutDuration);
    enforcer = await deployContract(
      Enforcer, verifier.address, taskPeriod, challengePeriod, bondAmount, maxExecutionDepth
    );

    let tx = await verifier.setEnforcer(enforcer.address);

    await tx.wait();

    // yes, we need a new provider. Otherwise we get duplicate events...
    const solverWallet = wallets[2].connect(new ethers.providers.JsonRpcProvider(provider.connection.url));
    const challengerWallet = wallets[3].connect(new ethers.providers.JsonRpcProvider(provider.connection.url));
    // let's be faster (events)
    solverWallet.provider.pollingInterval = 30;
    challengerWallet.provider.pollingInterval = 30;

    execPokerSolver = new MyExecutionPoker(
      enforcer,
      verifier,
      solverWallet,
      Constants.GAS_LIMIT,
      'solver'
    );
    after(function (done) {
      done();
      process.exit(0);
    });

    execPokerChallenger = new MyExecutionPoker(
      enforcer,
      verifier,
      challengerWallet,
      Constants.GAS_LIMIT,
      'challenger'
    );
    execPokerChallenger.alwaysChallenge = true;
  });

  // describe('with contract bytecode deployed', () => {
  //   disputeFixtures(
  //     async (code, callData, tStorage, solverMerkle, challengerMerkle, expectedWinner) => {
  //       // use merkle tree from fixture
  //       execPokerSolver._merkle = solverMerkle;
  //       execPokerSolver._steps = [];
  //       execPokerChallenger._merkle = challengerMerkle;
  //       execPokerChallenger._steps = [];

  //       const winner = await doGame(
  //         { verifier, code, callData, tStorage, execPokerSolver, execPokerChallenger, doDeployCode: true }
  //       );
  //       assert.equal(winner, expectedWinner, 'winner should match fixture');
  //       await onchainWait(10);
  //     }
  //   );
  // });

  describe('without contract bytecode deployed', () => {
    disputeFixtures(
      async (code, callData, tStorage, solverMerkle, challengerMerkle, expectedWinner) => {
        // use merkle tree from fixture
        execPokerSolver._merkle = solverMerkle;
        execPokerSolver._steps = [];
        execPokerChallenger._merkle = challengerMerkle;
        execPokerChallenger._steps = [];

        const winner = await doGame(
          { verifier, code, callData, tStorage, execPokerSolver, execPokerChallenger }
        );
        assert.equal(winner, expectedWinner, 'winner should match fixture');
        await onchainWait(10);
      }
    );
  });
});
