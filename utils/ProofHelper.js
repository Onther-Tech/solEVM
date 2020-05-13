'use strict';

const Merkelizer = require('./Merkelizer');
const { ZERO_HASH } = require('./constants');
const FragmentTree = require('./FragmentTree');
const web3 = require('web3');

function isEmptyObject(param) {
  return Object.keys(param).length === 0;
}

module.exports = class ProofHelper {
  static constructProof (computationPath, { merkle, codeFragmentTree } = {}) {
    const prevOutput = computationPath.left.executionState;
    const execState = computationPath.right.executionState;
    const isFirstStep = computationPath.isFirstExecutionStep;
    const callStart = computationPath.callStart;
    const callEnd = computationPath.callEnd;
    const isStorageDataRequired = execState.isStorageDataRequired;
    const isStorageDataChanged = execState.isStorageDataChanged;
    const storageProof = execState.storageProof;
    const callValueProof = execState.callValueProof;
    const isCALLValue = execState.isCALLValue;
    const isCREATE = execState.isCREATE;
    const isCREATE2 = execState.isCREATE2;
    
    const runtimeProof = execState.storageAccount;
    const runtimeKey = web3.utils.soliditySha3(runtimeProof.addr);
    const runtimeLeaf = web3.utils.soliditySha3(runtimeProof.rlpVal);

    const bytecodeProof = execState.bytecodeAccount;
    const bytecodeKey = web3.utils.soliditySha3(bytecodeProof.addr);
    const bytecodeLeaf = web3.utils.soliditySha3(bytecodeProof.rlpVal);
 
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
        callerKey: runtimeKey,
        calleeKey: Buffer.alloc(32),
        callerBeforeLeaf: runtimeLeaf,
        callerAfterLeaf: Buffer.alloc(32),
        calleeBeforeLeaf: Buffer.alloc(32),
        calleeAfterLeaf: Buffer.alloc(32),
        beforeRoot: prevOutput.stateRoot,
        intermediateRoot: Buffer.alloc(32),
        afterRoot: Buffer.alloc(32),
        callerSiblings: runtimeProof.siblings,
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
    } else if ((isCREATE || isCREATE2) && callStart) {
      merkleProof = {
        callerKey: runtimeKey,
        calleeKey: Buffer.alloc(32),
        callerBeforeLeaf: Buffer.alloc(32),
        callerAfterLeaf: runtimeLeaf,
        calleeBeforeLeaf: Buffer.alloc(32),
        calleeAfterLeaf: Buffer.alloc(32),
        beforeRoot: prevOutput.stateRoot,
        intermediateRoot: Buffer.alloc(32),
        afterRoot: execState.stateRoot,
        callerSiblings: runtimeProof.siblings,
        calleeSiblings: Buffer.alloc(32),
      }
    } else if (callStart || callEnd) {
      merkleProof = {
        callerKey: runtimeKey,
        calleeKey: bytecodeKey,
        callerBeforeLeaf: runtimeLeaf,
        callerAfterLeaf: Buffer.alloc(32),
        calleeBeforeLeaf: bytecodeLeaf,
        calleeAfterLeaf: Buffer.alloc(32),
        beforeRoot: prevOutput.stateRoot,
        intermediateRoot: Buffer.alloc(32),
        afterRoot: Buffer.alloc(32),
        callerSiblings: runtimeProof.siblings,
        calleeSiblings: bytecodeProof.siblings,
      }
    } 
    
    let isMemoryRequired = false;
    if (execState.memReadHigh !== -1 || execState.memWriteHigh !== -1) {
      isMemoryRequired = true;
    }

    let isCallDataRequired = false;
    if (execState.callDataReadHigh !== -1 || execState.callDataWriteHigh !== -1) {
      isCallDataRequired = true;
    }

    const proofs = {
      stackHash: (callStart || callEnd) ? prevOutput.stackHash || Merkelizer.stackHash([]) 
        : execState.compactStackHash || Merkelizer.stackHash([]),
      memHash: isMemoryRequired ? ZERO_HASH : Merkelizer.memHash(prevOutput.mem),
      dataHash: isCallDataRequired ? ZERO_HASH : Merkelizer.dataHash(prevOutput.data),
      codeByteLength: 0,
      codeFragments: [],
      codeProof: [],
      stateRoot : prevOutput.stateRoot,
      storageRoot : prevOutput.storageRoot,
      previousRuntimeStackHash: prevOutput.previousRuntimeStackHash,
      runtimeStackHash: prevOutput.runtimeStackHash,
      accountHash : prevOutput.accountHash,
      storageAccount : prevOutput.storageAccount,
      bytecodeAccount : prevOutput.bytecodeAccount,
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
      // console.log('ProofHelper', 'test2')
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
   
    let beforeCalleeAccount = {};
    if (isEmptyObject(execState.beforeCalleeAccount)) {
      beforeCalleeAccount.addr = '0x' + '0'.padStart(40,0);
      beforeCalleeAccount.rlpVal = '0x';
      beforeCalleeAccount.stateRoot = '0x' + '0'.padStart(64,0);
      beforeCalleeAccount.siblings = '0x';
    } else {
      beforeCalleeAccount = execState.beforeCalleeAccount;
    }

    // @dev: in case of OPCODEs like CALL including CREATE, CREATE2, get stack 
    // because there is callee steps between before CALL step after CALL step.
    let stack;
    if (isCREATE) {
      stack = prevOutput.stack.reverse().slice(0,3).reverse();
    } else if (isCREATE2) {
      stack = prevOutput.stack.reverse().slice(0,4).reverse();
    } else if (isCALLValue || callStart) {
      stack = prevOutput.stack.reverse().slice(0,7).reverse();
    }
  
    return {
      proofs,
      executionInput: {
        data: isCallDataRequired ? prevOutput.data : '0x',
        stack: (callStart) ? stack : execState.compactStack,
        mem: isMemoryRequired ? prevOutput.mem : [],
        tStorage: isStorageDataRequired ? prevOutput.tStorage : [],
        logHash: prevOutput.logHash,
        returnData: prevOutput.returnData,
        pc: prevOutput.pc,
        gasRemaining: prevOutput.gasRemaining,
        stackSize: prevOutput.stackSize,
        memSize: prevOutput.memSize,
        isCREATE: execState.isCREATE,
        isCREATE2: execState.isCREATE2,
        initCodeHash: execState.initCodeHash,
        isCALL: execState.isCALL,
        isDELEGATECALL: execState.isDELEGATECALL,
        isStorageReset: execState.isStorageReset ? true : false,
        isStorageDataChanged: isStorageDataChanged,
        isFirstStep: isFirstStep,
        callDepth: computationPath.callDepth,
        callStart: callStart,
        callEnd: callEnd,
        callValue: isCALLValue,
        beforeCalleeAccount: beforeCalleeAccount,
        previousRuntimeStackHash: execState.previousRuntimeStackHash,
        runtimeStackHash: execState.runtimeStackHash,
        storageAccount: execState.storageAccount,
        bytecodeAccount: execState.bytecodeAccount,
        accountHash : execState.accountHash,
        storageRoot : execState.storageRoot,
        stateRoot : execState.stateRoot,
      },
      merkleProof,
    };
  }
};
