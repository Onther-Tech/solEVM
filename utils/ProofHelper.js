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
    
    const callerProof = execState.callerAccount;
    const callerKey = web3.utils.soliditySha3(callerProof.addr);
    const callerLeaf = web3.utils.soliditySha3(callerProof.rlpVal);
 
    const calleeProof = execState.calleeAccount;
    const calleeKey = web3.utils.soliditySha3(calleeProof.addr);
    const calleeLeaf = web3.utils.soliditySha3(calleeProof.rlpVal);
       
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
        callerKey: (computationPath.callDepth === 0) ? callerKey : calleeKey,
        calleeKey: Buffer.alloc(32),
        callerBeforeLeaf: (computationPath.callDepth === 0) ? callerLeaf : calleeLeaf,
        callerAfterLeaf: Buffer.alloc(32),
        calleeBeforeLeaf: Buffer.alloc(32),
        calleeAfterLeaf: Buffer.alloc(32),
        beforeRoot: (computationPath.callDepth === 0) ? callerProof.stateRoot : calleeProof.stateRoot,
        intermediateRoot: Buffer.alloc(32),
        afterRoot: Buffer.alloc(32),
        callerSiblings: (computationPath.callDepth === 0) ? callerProof.siblings : calleeProof.siblings,
        calleeSiblings:  Buffer.alloc(32),
      }
      // console.log('beforeStateProof', beforeStateProof)
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
    } else if (callStart) {
      merkleProof = {
        callerKey: callerKey,
        calleeKey: calleeKey,
        callerBeforeLeaf: callerLeaf,
        callerAfterLeaf: Buffer.alloc(32),
        calleeBeforeLeaf: calleeLeaf,
        calleeAfterLeaf: Buffer.alloc(32),
        beforeRoot: prevOutput.stateRoot,
        intermediateRoot: Buffer.alloc(32),
        afterRoot: execState.stateRoot,
        callerSiblings: callerProof.siblings,
        calleeSiblings: calleeProof.siblings,
      }
    } else if (callEnd) {
      merkleProof = {
        callerKey: callerKey,
        calleeKey: calleeKey,
        callerBeforeLeaf: callerLeaf,
        callerAfterLeaf: Buffer.alloc(32),
        calleeBeforeLeaf: calleeLeaf,
        calleeAfterLeaf: Buffer.alloc(32),
        beforeRoot: prevOutput.stateRoot,
        intermediateRoot: Buffer.alloc(32),
        afterRoot: execState.stateRoot,
        callerSiblings: callerProof.siblings,
        calleeSiblings: calleeProof.siblings,
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

    const beforeAccountHash = prevOutput.accountHash;
    const afterAccountHash = execState.accountHash;
   
    const proofs = {
      stackHash: (callStart || callEnd) ? prevOutput.stackHash || Merkelizer.stackHash([]) 
        : execState.compactStackHash || Merkelizer.stackHash([]),
      memHash: isMemoryRequired ? ZERO_HASH : Merkelizer.memHash(prevOutput.mem),
      dataHash: isCallDataRequired ? ZERO_HASH : Merkelizer.dataHash(prevOutput.data),
      codeByteLength: 0,
      codeFragments: [],
      codeProof: [],
      beforeStateRoot : prevOutput.stateRoot,
      afterStateRoot : execState.stateRoot,
      beforeStorageRoot : prevOutput.storageRoot,
      afterStorageRoot : execState.storageRoot,
      beforeAccountHash : beforeAccountHash,
      afterAccountHash : afterAccountHash,
      beforeCallerAccount: prevOutput.callerAccount,
      beforeCalleeAccount: prevOutput.calleeAccount,
      calleeCodeHash: ZERO_HASH,

    };
  
    if (computationPath.callDepth !== 0 && !callStart && !callEnd) {
      // console.log('ProofHelper', 'test1')
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
    // console.log(execState.beforeCallerAccount)
    let beforeCallerAccount = {};
    if (isEmptyObject(execState.beforeCallerAccount)) {
      beforeCallerAccount.addr = '0x' + '0'.padStart(40,0);
      beforeCallerAccount.rlpVal = '0x';
      beforeCallerAccount.stateRoot = '0x' + '0'.padStart(64,0);
      beforeCallerAccount.siblings = '0x';
    } else {
      beforeCallerAccount = execState.beforeCallerAccount;
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
   
    return {
      proofs,
      executionInput: {
        data: isCallDataRequired ? prevOutput.data : '0x',
        stack: (isCALLValue || callStart) ? prevOutput.stack.reverse().slice(0,7).reverse() : execState.compactStack,
        mem: isMemoryRequired ? prevOutput.mem : [],
        tStorage: isStorageDataRequired ? prevOutput.tStorage : [],
        logHash: prevOutput.logHash,
        returnData: prevOutput.returnData,
        pc: prevOutput.pc,
        gasRemaining: prevOutput.gasRemaining,
        stackSize: prevOutput.stackSize,
        memSize: prevOutput.memSize,
        isCALL: prevOutput.isCALL,
        isDELEGATECALL: prevOutput.isDELEGATECALL,
        isStorageReset: execState.isStorageReset ? true : false,
        isStorageDataChanged: isStorageDataChanged,
        isFirstStep: isFirstStep,
        callDepth: computationPath.callDepth,
        callStart: callStart,
        callEnd: callEnd,
        callValue: isCALLValue,
        beforeCallerAccount: beforeCallerAccount,
        beforeCalleeAccount: beforeCalleeAccount,
        afterCallerAccount: execState.callerAccount,
        afterCalleeAccount: execState.calleeAccount,
      },
      merkleProof,
    };
  }
};
