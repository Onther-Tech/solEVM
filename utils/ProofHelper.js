'use strict';

const Merkelizer = require('./Merkelizer');
const { ZERO_HASH } = require('./constants');
const FragmentTree = require('./FragmentTree');

module.exports = class ProofHelper {
  static constructProof (computationPath, { merkle, codeFragmentTree } = {}) {
    const prevOutput = computationPath.left.executionState;
    const execState = computationPath.right.executionState;
    const isFirstStep = computationPath.isFirstExecutionStep;
    const callStart = computationPath.callStart;
    const callEnd = computationPath.callEnd;
    const isStorageDataRequired = execState.isStorageDataRequired;
    const isStorageDataChanged = execState.isStorageDataChanged;
    const beforeStateProof = prevOutput.stateProof;
    const afterStateProof = execState.stateProof;
    const storageProof = execState.storageProof;
    const callValueProof = execState.callValueProof;
    const isCALLValue = execState.isCALLValue;

    // console.log('proofHelper prevOutput', prevOutput);
    // console.log('proofHelper execState', execState);
    let merkleProof = {
        callerKey: Buffer.alloc(32),
        calleeKey: Buffer.alloc(32),
        callerBeforeLeaf: Buffer.alloc(32),
        callerAfterLeaf: Buffer.alloc(32),
        calleeBeforeLeaf: Buffer.alloc(32),
        calleeAfterLeaf: Buffer.alloc(32),
        beforeRoot: Buffer.alloc(32),
        intermediateRoot: Buffer.alloc(32),
        afterRoot: Buffer.alloc(32),
        callerSiblings: Buffer.alloc(32),
        calleeSiblings:  Buffer.alloc(32),
    };
    if (isFirstStep) {
      merkleProof = {
        callerKey: beforeStateProof.hashedKey,
        calleeKey: Buffer.alloc(32),
        callerBeforeLeaf: beforeStateProof.leaf,
        callerAfterLeaf: Buffer.alloc(32),
        calleeBeforeLeaf: Buffer.alloc(32),
        calleeAfterLeaf: Buffer.alloc(32),
        beforeRoot: beforeStateProof.stateRoot,
        intermediateRoot: Buffer.alloc(32),
        afterRoot: Buffer.alloc(32),
        callerSiblings: beforeStateProof.siblings,
        calleeSiblings:  Buffer.alloc(32),
      }
    } else if (isStorageDataChanged) {
      merkleProof = {
        callerKey: storageProof.hashedKey,
        calleeKey: Buffer.alloc(32),
        callerBeforeLeaf: storageProof.beforeLeaf,
        callerAfterLeaf: storageProof.afterLeaf,
        calleeBeforeLeaf: Buffer.alloc(32),
        calleeAfterLeaf: Buffer.alloc(32),
        beforeRoot: prevOutput.storageRoot,
        intermediateRoot: Buffer.alloc(32),
        afterRoot: execState.storageRoot,
        callerSiblings: storageProof.siblings,
        calleeSiblings:  Buffer.alloc(32),
      }
    } else if (isCALLValue) {
      merkleProof = {
        callerKey: callValueProof.callerKey,
        calleeKey: callValueProof.calleeKey,
        callerBeforeLeaf: callValueProof.callerBeforeLeaf,
        callerAfterLeaf: callValueProof.callerAfterLeaf,
        calleeBeforeLeaf: callValueProof.calleeBeforeLeaf,
        calleeAfterLeaf: callValueProof.calleeAfterLeaf,
        beforeRoot: callValueProof.beforeRoot,
        intermediateRoot: callValueProof.intermediateRoot,
        afterRoot: callValueProof.afterRoot,
        callerSiblings: callValueProof.callerSiblings,
        calleeSiblings: callValueProof.calleeSiblings,
      }
    } else if (callStart || callEnd) {
      merkleProof = {
        callerKey: beforeStateProof.hashedKey,
        calleeKey: afterStateProof.hashedKey,
        callerBeforeLeaf: beforeStateProof.leaf,
        callerAfterLeaf: Buffer.alloc(32),
        calleeBeforeLeaf: afterStateProof.leaf,
        calleeAfterLeaf: Buffer.alloc(32),
        beforeRoot: beforeStateProof.stateRoot,
        intermediateRoot: Buffer.alloc(32),
        afterRoot: afterStateProof.stateRoot,
        callerSiblings: beforeStateProof.siblings,
        calleeSiblings: afterStateProof.siblings,
      }
    } 
    // console.log('Proof Helper', merkleProof);
    let isMemoryRequired = false;
    if (execState.memReadHigh !== -1 || execState.memWriteHigh !== -1) {
      isMemoryRequired = true;
    }

    let isCallDataRequired = false;
    if (execState.callDataReadHigh !== -1 || execState.callDataWriteHigh !== -1) {
      isCallDataRequired = true;
    }

    const proofs = {
      stackHash: execState.compactStackHash || Merkelizer.stackHash([]),
      memHash: isMemoryRequired ? ZERO_HASH : Merkelizer.memHash(prevOutput.mem),
      dataHash: isCallDataRequired ? ZERO_HASH : Merkelizer.dataHash(prevOutput.data),
      tStorageHash: isStorageDataRequired ? ZERO_HASH : Merkelizer.storageHash(prevOutput.tStorage),
      codeByteLength: 0,
      codeFragments: [],
      codeProof: [],
      beforeStateRoot : prevOutput.stateRoot,
      afterStateRoot : execState.stateRoot,
      beforeStorageRoot : prevOutput.storageRoot,
      afterStorageRoot : execState.storageRoot,
      calleeCodeHash: ZERO_HASH,
    };
    
    if (computationPath.callDepth !== 0 && !callStart && !callEnd) {
      
      const code = computationPath.code;
      const calleeFragmentTree = new FragmentTree().run(code);
      const calleeCodeHash = calleeFragmentTree.root.hash;
      
      const leaves = calleeFragmentTree.leaves;
      const neededSlots = [];

      // convert to 32 byte-sized words
      execState.codeReads.forEach(
        function (val) {
          val = val >> 5;
          if (neededSlots.indexOf(val) === -1) {
            neededSlots.push(val);
          }
        }
      );

      for (let i = 0; i < neededSlots.length; i++) {
        const slot = neededSlots[i];
        const leaf = leaves[slot];

        if (leaf.hash === ZERO_HASH) {
          continue;
        }
        // panic, just in case
        if (leaf.slot !== slot) {
          throw new Error('FragmentTree for contract code is not sorted');
        }

        proofs.codeFragments.push('0x' + leaf.slot.toString(16).padStart(64, '0'));
        proofs.codeFragments.push(leaf.value);

        const proof = calleeFragmentTree.calculateProof(leaf.slot);
        // paranoia
        if (!calleeFragmentTree.verifyProof(leaf, proof)) {
          throw new Error(`Can not verify proof for ${leaf}`);
        }

        proofs.codeProof = proofs.codeProof.concat(proof);
        proofs.codeByteLength = leaf.byteLength;
        proofs.calleeCodeHash = calleeCodeHash;
      }  
    } else if (computationPath.callDepth === 0 && codeFragmentTree && !callStart) {
      // console.log('ProofHelper', 'CALLER')
      const leaves = codeFragmentTree.leaves;
      const neededSlots = [];

      // convert to 32 byte-sized words
      execState.codeReads.forEach(
        function (val) {
          val = val >> 5;
          if (neededSlots.indexOf(val) === -1) {
            neededSlots.push(val);
          }
        }
      );

      for (let i = 0; i < neededSlots.length; i++) {
        const slot = neededSlots[i];
        const leaf = leaves[slot];

        if (leaf.hash === ZERO_HASH) {
          continue;
        }
        // panic, just in case
        if (leaf.slot !== slot) {
          throw new Error('FragmentTree for contract code is not sorted');
        }

        proofs.codeFragments.push('0x' + leaf.slot.toString(16).padStart(64, '0'));
        proofs.codeFragments.push(leaf.value);

        const proof = codeFragmentTree.calculateProof(leaf.slot);
        // paranoia
        if (!codeFragmentTree.verifyProof(leaf, proof)) {
          throw new Error(`Can not verify proof for ${leaf}`);
        }

        proofs.codeProof = proofs.codeProof.concat(proof);
        proofs.codeByteLength = leaf.byteLength;
      }
    }
    
    return {
      proofs,
      executionInput: {
        data: isCallDataRequired ? prevOutput.data : '0x',
        stack: execState.compactStack,
        mem: isMemoryRequired ? prevOutput.mem : [],
        tStorage: isStorageDataRequired ? prevOutput.tStorage : [],
        logHash: prevOutput.logHash,
        customEnvironmentHash: prevOutput.customEnvironmentHash,
        returnData: prevOutput.returnData,
        pc: prevOutput.pc,
        gasRemaining: prevOutput.gasRemaining,
        stackSize: prevOutput.stackSize,
        memSize: prevOutput.memSize,
        isStorageReset: execState.isStorageReset ? true : false,
        isStorageDataChanged: isStorageDataChanged,
        isFirstStep: isFirstStep,
        callDepth: computationPath.callDepth,
        callStart: callStart,
        callEnd: callEnd,
        callValue: isCALLValue,
      },
      merkleProof,
    };
  }
};
