const Merkelizer = require('../../utils/MerkelizerStorage');
const ProofHelper = require('../../utils/ProofHelperStorage');
const disputeFixtures = require('../fixtures/disputeStorage');
const { onchainWait, toBytes32, deployContract, txOverrides, deployCode } = require('../helpers/utils');
const OP = require('../../utils/constants');
const assertRevert = require('../helpers/assertRevert');
const debug = require('debug')('vgame-test');
const GAS_LIMIT = OP.GAS_LIMIT;

const Verifier = artifacts.require('VerifierStorage.sol');
const Enforcer = artifacts.require('Enforcer.sol');

const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';
const ONE_HASH = '0x0000000000000000000000000000000000000000000000000000000000000001';
const TWO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000002';
const ZERO_WITNESS_PATH = { left: ZERO_HASH, right: ZERO_HASH };
const SOLVER_VERIFIED = (1 << 2);
const CHALLENGER_VERIFIED = (1 << 3);

function computeWitnessPath (dispute, merkleTree) {
  const needsWitness = dispute.witness !== ZERO_HASH;

  if (needsWitness) {
    const path = merkleTree.getNode(dispute.witness);

    return { left: path.left.hash, right: path.right.hash };
  }

  return ZERO_WITNESS_PATH;
}

async function submitProofHelper (verifier, disputeId, code, computationPath) {
  const args = ProofHelper.constructProof(computationPath);

  let tx = await verifier.submitProof(
    disputeId,
    args.proofs,
    args.executionInput,
    txOverrides
  );

  tx = await tx.wait();

  /*
  tx.events.forEach(
    (ele) => {
      console.log(ele.args);
    }
  );
  */

  return tx;
}

async function disputeGame (
  enforcer, verifier, codeContract, code, callData, solverMerkle, challengerMerkle, expectedWinner, expectedError
) {
  let disputeId;

  try {
    let solverComputationPath = solverMerkle.root;
    let challengerComputationPath = challengerMerkle.root;

    // TODO: handle the bigger case too
    if (solverMerkle.depth < challengerMerkle.depth) {
      challengerComputationPath = challengerMerkle.tree[solverMerkle.depth - 1][0];
    }

    const bondAmount = await enforcer.bondAmount();

    let tx = await enforcer.register(
      codeContract,
      callData,
      solverComputationPath.hash,
      solverMerkle.depth,
      ZERO_HASH,
      { value: bondAmount, gasPrice: 0x01, gasLimit: GAS_LIMIT }
    );

    tx = await tx.wait();
    tx = await enforcer.dispute(
      codeContract,
      callData,
      challengerComputationPath.hash,
      { value: bondAmount, gasPrice: 0x01, gasLimit: GAS_LIMIT }
    );

    let dispute = await tx.wait();
    let event = dispute.events[0].args;

    disputeId = event.disputeId;

    while (true) {
      dispute = await verifier.disputes(event.disputeId);

      if (solverComputationPath.isLeaf && challengerComputationPath.isLeaf) {
        debug('REACHED leaves');

        debug('Solver: SUBMITTING FOR l=' +
          solverComputationPath.left.hash + ' r=' + solverComputationPath.right.hash);
        await submitProofHelper(verifier, event.disputeId, code, solverComputationPath);

        // refresh
        dispute = await verifier.disputes(event.disputeId);
        if ((dispute.state & SOLVER_VERIFIED === 0) && (dispute.state & CHALLENGER_VERIFIED === 0)) {
          debug('Challenger: SUBMITTING FOR l=' +
          challengerComputationPath.left.hash + ' r=' + challengerComputationPath.right.hash);
          await submitProofHelper(verifier, event.disputeId, code, challengerComputationPath);
        }

        // refresh again
        dispute = await verifier.disputes(event.disputeId);

        let winner = 'challenger';
        if ((dispute.state & SOLVER_VERIFIED) !== 0) {
          winner = 'solver';
        }
        debug('winner=' + winner);

        assert.equal(winner, expectedWinner, 'winner should match fixture');
        break;
      }

      if (!solverComputationPath.isLeaf) {
        let solverPath = dispute.solverPath;
        let nextPath = solverMerkle.getNode(solverPath);

        if (!nextPath) {
          debug('solver: submission already made by another party');
          solverComputationPath = solverMerkle.getPair(dispute.solver.left, dispute.solver.right);
          continue;
        }

        if (solverComputationPath.left.hash === solverPath) {
          debug('solver goes left from ' +
            solverComputationPath.hash.substring(2, 6) + ' to ' +
            solverComputationPath.left.hash.substring(2, 6)
          );
        } else if (solverComputationPath.right.hash === solverPath) {
          debug('solver goes right from ' +
            solverComputationPath.hash.substring(2, 6) + ' to ' +
            solverComputationPath.right.hash.substring(2, 6)
          );
        }

        solverComputationPath = nextPath;

        const witnessPath = computeWitnessPath(dispute, solverMerkle);

        debug('Solver respond\n',
          `\tleft = ${solverComputationPath.left.hash}`,
          `\tright = ${solverComputationPath.right.hash}`,
          `\twitnessPath = l=${witnessPath.left} r=${witnessPath.right}`);
        tx = await verifier.respond(
          event.disputeId,
          {
            left: solverComputationPath.left.hash,
            right: solverComputationPath.right.hash,
          },
          witnessPath,
          txOverrides
        );
        await tx.wait();
        dispute = await verifier.disputes(event.disputeId);
      }

      if (!challengerComputationPath.isLeaf) {
        let challengerPath = dispute.challengerPath;
        let nextPath = challengerMerkle.getNode(challengerPath);

        if (!nextPath) {
          debug('challenger submission already made by another party');
          challengerComputationPath =
            challengerMerkle.getPair(dispute.challenger.left, dispute.challenger.right);
          continue;
        }

        if (challengerComputationPath.left.hash === challengerPath) {
          debug('challenger goes left from ' +
            challengerComputationPath.hash.substring(2, 6) + ' to ' +
            challengerComputationPath.left.hash.substring(2, 6)
          );
        } else if (challengerComputationPath.right.hash === challengerPath) {
          debug('challenger goes right from ' +
            challengerComputationPath.hash.substring(2, 6) + ' to ' +
            challengerComputationPath.right.hash.substring(2, 6)
          );
        }

        challengerComputationPath = nextPath;

        const witnessPath = computeWitnessPath(dispute, challengerMerkle);

        debug('Challenger respond\n',
          `\tleft = ${challengerComputationPath.left.hash}`,
          `\tright = ${challengerComputationPath.right.hash}`,
          `\twitnessPath = l=${witnessPath.left} r=${witnessPath.right}`);
        tx = await verifier.respond(
          event.disputeId,
          {
            left: challengerComputationPath.left.hash,
            right: challengerComputationPath.right.hash,
          },
          witnessPath,
          txOverrides
        );
        await tx.wait();
      }
    }
  } catch (e) {
    if (expectedError) {
      assert.equal(e.message, expectedError);
      return;
    }

    // refresh again
    const dispute = await verifier.disputes(disputeId);

    let winner = 'challenger';
    if ((dispute.state & SOLVER_VERIFIED) !== 0) {
      winner = 'solver';
    }
    debug('winner=' + winner);

    assert.equal(winner, expectedWinner, 'winner should match fixture');
  }
}

contract('Verifier', function () {
  let enforcer;
  let verifier;

  before(async () => {
    const challengePeriod = 1000;
    const timeoutDuration = 10;
    const bondAmount = 1;
    const maxExecutionDepth = 10;

    verifier = await deployContract(Verifier, timeoutDuration);
    enforcer = await deployContract(Enforcer, verifier.address, challengePeriod, bondAmount, maxExecutionDepth);

    let tx = await verifier.setEnforcer(enforcer.address);

    await tx.wait();
  });

  disputeFixtures(
    async (code, callData, solverMerkle, challengerMerkle, expectedWinner) => {
      const codeContract = await deployCode(code);

      await disputeGame(
        enforcer,
        verifier,
        codeContract.address,
        code,
        callData,
        solverMerkle,
        challengerMerkle,
        expectedWinner
      );
    }
  );
});
