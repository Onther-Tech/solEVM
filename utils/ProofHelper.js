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
        
    let storageProof = [];
    if (isFirstStep || callStart || callEnd || isStorageDataRequired) {
      
      const intermediateStorageProof = execState.intermediateStorageProof;
            
      for (let i = 0; i < intermediateStorageProof.length; i++) {
      
        const obj = {
          storageRoot: intermediateStorageProof[i].storageRoot,
          key: '0x' + intermediateStorageProof[i].key,
          val: '0x' + intermediateStorageProof[i].val,
          mptPath: intermediateStorageProof[i].hashedKey,
          rlpStack: intermediateStorageProof[i].stack 
        }
        storageProof.push(obj);
      }
    }
    // console.log('ProofHelper', storageProof)
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
      tStorageHash: execState.isStorageDataRequired ? ZERO_HASH : Merkelizer.storageHash(prevOutput.tStorage),
      codeByteLength: 0,
      codeFragments: [],
      codeProof: [],
      beforeStorageRoot : prevOutput.intermediateStorageRoot,
      afterStorageRoot : execState.intermediateStorageRoot,
      calleeCodeHash: ZERO_HASH,
    };
    // console.log('ProofHelper', proofs)
    if (computationPath.callDepth !== 0) {
      // console.log('ProofHelper', 'CALLEE')
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
        tStorage: execState.isStorageDataRequired ? prevOutput.tStorage : [],
        logHash: prevOutput.logHash,
        customEnvironmentHash: prevOutput.customEnvironmentHash,
        returnData: prevOutput.returnData,
        pc: prevOutput.pc,
        gasRemaining: prevOutput.gasRemaining,
        stackSize: prevOutput.stackSize,
        memSize: prevOutput.memSize,
        isStorageReset: execState.isStorageReset ? true : false,
        isStorageDataRequired: execState.isStorageDataRequired,
        isFirstStep: isFirstStep,
        callDepth: computationPath.callDepth,
        callStart: callStart,
        callEnd: callEnd,
      },
      storageProof,
    };
  }
};
