
const Merkelizer = require('./MerkelizerStorage');

const { ZERO_HASH } = require('./constants');

module.exports = class ProofHelper {
  static constructProof (computationPath) {
    const prevOutput = computationPath.left.executionState;
    const execState = computationPath.right.executionState;
    const proofs = {
      stackHash: Merkelizer.stackHash(
        prevOutput.stack.slice(0, prevOutput.stack.length - execState.compactStack.length)
      ),
      memHash: execState.isMemoryRequired ? ZERO_HASH : Merkelizer.memHash(prevOutput.mem),
      dataHash: execState.isCallDataRequired ? ZERO_HASH : Merkelizer.dataHash(prevOutput.data),
      tStorageHash: execState.isStorageDataRequired ? ZERO_HASH : Merkelizer.storageHash(prevOutput.tStorage)
    };

    return {
      proofs,
      executionInput: {
        data: (execState.isCallDataRequired ? prevOutput.data : '0x'),
        stack: execState.compactStack,
        mem: execState.isMemoryRequired ? prevOutput.mem : [],
        tStorage: execState.isStorageDataRequired ? prevOutput.tStorage : [],
        customEnvironmentHash: ZERO_HASH,
        returnData: prevOutput.returnData,
        pc: prevOutput.pc,
        gasRemaining: prevOutput.gasRemaining,
        stackSize: prevOutput.stackSize,
        memSize: prevOutput.memSize,
      },
    };
  }
};
