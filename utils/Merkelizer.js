'use strict';

const ethers = require('ethers');
const createKeccakHash = require('keccak');
const HexaryTrie = require('./HexaryTrie');
const AbstractMerkleTree = require('./AbstractMerkleTree');
const { ZERO_HASH } = require('./constants');

module.exports = class MerkelizerStorage extends AbstractMerkleTree {
  /// @notice If the first (left-most) hash is not the same as this,
  /// then the solution from that player is invalid.
  static initialStateHash (initStorageProof, initStorageRoot, code, callData, tStorage, customEnvironmentHash) {
    const DEFAULT_GAS = 0x0fffffffffffff;
    const res = {
      executionState: {
        code: code,
        data: callData,
        compactStack: [],
        stack: [],
        mem: [],
        tStorage: tStorage || [],
        returnData: '0x',
        pc: 0,
        errno: 0,
        gasRemaining: DEFAULT_GAS,
        stackSize: 0,
        memSize: 0,
        tStorageSize: 0,
        isStorageReset: false,
        customEnvironmentHash: customEnvironmentHash,
        stackHash: this.stackHash([]),
        memHash: this.memHash([]),
        dataHash: this.dataHash(callData),
        tStorageHash: this.storageHash(tStorage) || this.storageHash([]),
        logHash: ZERO_HASH,
        intermediateStorageRoot: initStorageRoot,
        initStorageProof: initStorageProof,
      },
    };
    
    res.hash = this.stateHash(res.executionState);
    // console.log('initialStateHash', res.executionState.tStorage)
    return res;
  }

  static stackHashes (stack, sibling) {
    const res = sibling || ZERO_HASH;
    const hashes = [res];
    const len = stack.length;

    if (len === 0) {
      return hashes;
    }

    // could be further improved by a custom keccak implementation
    const hash = createKeccakHash('keccak256');

    hash.update(Buffer.from(res.replace('0x', ''), 'hex'));
    for (let i = 0; i < len; i++) {
      const val = Buffer.from(stack[i].replace('0x', ''), 'hex');

      hash.update(val);

      if (i !== len - 1) {
        const buf = hash.digest();
        hashes.push(`0x${buf.toString('hex')}`);
        hash._finalized = false;
        hash.update(buf);
      }
    }

    hashes.push(`0x${hash.digest().toString('hex')}`);
    return hashes;
  }

  static stackHash (stack, sibling) {
    const res = this.stackHashes(stack, sibling);
    return res[res.length - 1];
  }

  static memHash (mem) {
    const len = mem.length;
    const hash = createKeccakHash('keccak256');

    for (let i = 0; i < len; i++) {
      hash.update(Buffer.from(mem[i].replace('0x', ''), 'hex'));
    }

    return `0x${hash.digest().toString('hex')}`;
  }

  static dataHash (data) {
    return ethers.utils.solidityKeccak256(
      ['bytes'],
      [data]
    );
  }

  static storageHash (tStorage) {
    return ethers.utils.solidityKeccak256(
      ['bytes[]'],
      [tStorage]
    );
  }

  static envHash (execution) {
    return ethers.utils.solidityKeccak256(
      [
        'bytes32',
        'bytes32',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
      ],
      [
        execution.logHash,
        execution.customEnvironmentHash,
        execution.pc,
        execution.gasRemaining,
        execution.stackSize,
        execution.memSize,
      ]
    );
  }

  static preStateHash (execution) {
    const intermediateHash = ethers.utils.solidityKeccak256(
      [
        'bytes32',
        'bytes32',
        'bytes32',
        'bytes32',
        'bytes32',
      ],
      [
        execution.stackHash,
        execution.memHash,
        execution.dataHash,
        execution.tStorageHash,
        execution.intermediateStorageRoot,
      ]
    );

    const envHash = ethers.utils.solidityKeccak256(
      [
        'bytes32',
        'bytes32',
        'uint256',
        // trick for CALL
        // 'uint256',
        'uint256',
        'uint256',
      ],
      [
        execution.logHash,
        execution.customEnvironmentHash,
        execution.pc,
        // trick for CALL
        // execution.gasRemaining,
        execution.stackSize,
        execution.memSize,
      ]
    );

    return ethers.utils.solidityKeccak256(
      [
        'bytes32',
        'bytes32',
      ],
      [
        intermediateHash,
        envHash
      ]
    );
  }

  static stateHash (execution) {
    // TODO: compact returnData

    return ethers.utils.solidityKeccak256(
      [
        'bytes32',
        'bytes',
      ],
      [
        this.preStateHash(execution),
        execution.returnData,
      ]
    );
  }

  makeLeave (initStorageProof, executions, code, callData, tStorage, customEnvironmentHash) {
    if (!executions || !executions.length) {
      throw new Error('You need to pass at least one execution step');
    }
    customEnvironmentHash = customEnvironmentHash || ZERO_HASH;
    
    let initStorageRoot = executions[0].intermediateStorageRoot;
    // console.log('makeLeave', initStorageRoot);
    if (!this.tree) {
      this.tree = [[]];
    }
    
    const initialState = this.constructor.initialStateHash(initStorageProof, initStorageRoot, code, callData, tStorage, customEnvironmentHash);
    const leaves = this.tree[0];
    const callDataHash = this.constructor.dataHash(callData);

    let prevLeaf = { right: initialState };
    let len = executions.length;
    let memHash;
    let tStorageHash;
    let afterCallTemp;

    for (let i = 0; i < len; i++) {
      const exec = executions[i];
      // console.log('makeLeave', exec)
      const stackHash = exec.stackHash;
      let logHash = exec.logHash;
      
      // memory is changed if either written to or if it was expanded
      let memoryChanged = exec.memWriteLow !== -1;
      if (!memoryChanged && prevLeaf.right.executionState) {
        memoryChanged = prevLeaf.right.executionState.memSize !== exec.memSize;
      }

      if (!memHash || memoryChanged) {
        memHash = this.constructor.memHash(exec.mem);
      }

      // convenience
      let tStorageChanged = false;
      if (!tStorageChanged) {
        tStorageChanged = prevLeaf.right.executionState.tStorage !== exec.tStorage;
      }

      if (!tStorageHash || tStorageChanged) {
        tStorageHash = this.constructor.storageHash(exec.tStorage) || ZERO_HASH;
      }

       // convenience
       exec.memSize = exec.mem.length;
       exec.data = callData;
       exec.dataHash = callDataHash;
       exec.memHash = memHash;
       exec.tStorageHash = tStorageHash;
      //  console.log('merkle', exec.intermediateStorageRoot)
       
       // TODO: the runtime should ultimately support and supply that
       exec.customEnvironmentHash = customEnvironmentHash;
                      
      const hash = this.constructor.stateHash(exec);
      
      let isFirstExecutionStep = i === 0;
      let isEndExecutionStep = (exec.opCodeName === 'RETURN' || exec.opCodeName === 'STOP' 
      || exec.opCodeName === 'REVERT' ) ? true : false;
      
      const pushLeaf = (beforeStep) => {
        return leaves.push(
          {
            left: beforeStep.right,
            right: {
              hash: hash,
              stackHash,
              memHash,
              tStorageHash,
              logHash,
              executionState: executions[i],
            },
            hash: this.constructor.hash(beforeStep.right.hash, hash),
            isLeaf: true,
            isFirstExecutionStep: isFirstExecutionStep,
            isEndExecutionStep: isEndExecutionStep,
            callDepth: exec.callDepth,
            code: code,
            intoCALLStep: false,
          }
        );
      }

      const recalLeaf = (left, right, isFirstExecutionStep = false, isEndExecutionStep = false) => {
        const obj = {
          left: left,
          right: right,
          hash: this.constructor.hash(left.hash, right.hash),
          isLeaf: true,
          isFirstExecutionStep: isFirstExecutionStep,
          isEndExecutionStep: isEndExecutionStep,
          callDepth: exec.callDepth - 1,
        };
             
        return obj;
      }
      
      if (exec.callDepth !== 0 && isFirstExecutionStep) {
        afterCallTemp = leaves[leaves.length-1];
        const beforeCall = recalLeaf(leaves[leaves.length-1].left, prevLeaf.right);
        beforeCall.intoCALLStep = true;
        // console.log('makeLeave', beforeCall)
        leaves[leaves.length-1] = beforeCall;
        const llen = pushLeaf(prevLeaf);
        prevLeaf = leaves[llen - 1];
        // console.log('makeLeave', prevLeaf)
      } else if (exec.callDepth !== 0 && isEndExecutionStep) {
        const afterCall = recalLeaf(prevLeaf.right, afterCallTemp.right, false, true);
        const llen = leaves.push(afterCall);
        prevLeaf = leaves[llen - 1];
      } else {
        const llen = pushLeaf(prevLeaf);
        prevLeaf = leaves[llen - 1];
      }
     
      if (exec.isCALLExecuted) {
        const initStorageProof = exec.calleeProof;
        const steps = exec.calleeSteps;
        const code = exec.calleeCode;
        const callData = exec.calleeCallData;
        const tStorage = [];
        // const tStorage = exec.calleeTstorage;
        // console.log('makeLeave', tStorage)
        
        this.makeLeave(initStorageProof, steps, code, callData, tStorage, customEnvironmentHash);    
      }
    }
  }

  run (initStorageProof, executions, code, callData, tStorage, customEnvironmentHash) {
    this.makeLeave(initStorageProof, executions, code, callData, tStorage, customEnvironmentHash);
    this.recal(0);

    return this;
  }

  /// @notice Calculates a proof for `returnData` of the last execution step.
  /// @return Array
  computeResultProof () {
    const resultProof = [];

    let returnData;
    let node = this.root;
    while (true) {
      let hash = node.right.hash;

      if (node.isLeaf) {
        if (node.right.hash === ZERO_HASH) {
          const preHash = this.constructor.preStateHash(node.left.executionState);

          returnData = node.left.executionState.returnData;
          resultProof.push(preHash);
          resultProof.push(node.right.hash);
        } else {
          const preHash = this.constructor.preStateHash(node.right.executionState);

          returnData = node.right.executionState.returnData;
          resultProof.push(node.left.hash);
          resultProof.push(preHash);
        }
        break;
      }

      resultProof.push(node.left.hash);
      resultProof.push(node.right.hash);

      if (hash === ZERO_HASH) {
        hash = node.left.hash;
      }
      node = this.getNode(hash);
    }

    return { resultProof, returnData };
  }

  /// @notice Verifies a proof from `computeResultProof`.
  /// @return `true` if correct, else `false`
  verifyResultProof (resultProof, returnData, rootHash) {
    const len = resultProof.length;

    if (len < 2 || (len % 2) !== 0) {
      return false;
    }

    // save those temporarily
    let tmpLeft = resultProof[len - 2];
    let tmpRight = resultProof[len - 1];
    if (tmpRight === ZERO_HASH) {
      resultProof[len - 2] =
        ethers.utils.solidityKeccak256(['bytes32', 'bytes'], [tmpLeft, returnData]);
    } else {
      resultProof[len - 1] =
        ethers.utils.solidityKeccak256(['bytes32', 'bytes'], [tmpRight, returnData]);
    }

    let valid = true;
    let parentHash = rootHash;
    for (let i = 0; i < len; i += 2) {
      const left = resultProof[i];
      const right = resultProof[i + 1];
      const hash = this.constructor.hash(left, right);

      if (hash !== parentHash) {
        valid = false;
        break;
      }

      if (right === ZERO_HASH) {
        parentHash = left;
      } else {
        parentHash = right;
      }
    }

    // restore the values we swapped above
    resultProof[len - 2] = tmpLeft;
    resultProof[len - 1] = tmpRight;

    return valid;
  }
};
