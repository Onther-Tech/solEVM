'use strict';

const ethers = require('ethers');
const createKeccakHash = require('keccak');
const HexaryTrie = require('./HexaryTrie');
const AbstractMerkleTree = require('./AbstractMerkleTree');
const { ZERO_HASH } = require('./constants');
const _ = require('lodash');

module.exports = class MerkelizerStorage extends AbstractMerkleTree {
  /// @notice If the first (left-most) hash is not the same as this,
  /// then the solution from that player is invalid.
  static initialStateHash (
    isCALLValue, 
    callValueProof, 
    callerAccount, 
    calleeAccount, 
    stateProof, 
    stateRoot, 
    storageRoot, 
    code, 
    callData
  ) {
    const DEFAULT_GAS = 0x0fffffffffffff;
    const res = {
      executionState: {
        code: code,
        data: callData,
        compactStack: [],
        stack: [],
        mem: [],
        returnData: '0x',
        pc: 0,
        errno: 0,
        gasRemaining: DEFAULT_GAS,
        stackSize: 0,
        memSize: 0,
        isStorageReset: false,
        stackHash: this.stackHash([]),
        memHash: this.memHash([]),
        dataHash: this.dataHash(callData),
        logHash: ZERO_HASH,
        accountHash: this.accountHash(callerAccount, calleeAccount),
        stateRoot: stateRoot,
        stateProof: stateProof,
        storageRoot: storageRoot,
        isStorageDataRequired: false,
        isStorageDataChanged: false,
        isCALLValue: isCALLValue,
        callerAccount: callerAccount,
        calleeAccount: calleeAccount,
        callValueProof: callValueProof
      },
    };
    
    res.hash = this.stateHash(res.executionState);
    // console.log('initialStateHash', res.executionState.accountHash.toString('hex'))
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

  static accountHash (caller, callee) {
    
    const callerHash = ethers.utils.solidityKeccak256(
      ['address', 'bytes'],
      [caller.addr, caller.rlpVal]
    );
    const calleeHash = ethers.utils.solidityKeccak256(
        ['address', 'bytes'],
        [callee.addr, callee.rlpVal]
    );
    return ethers.utils.solidityKeccak256(
      ['bytes32', 'bytes32'],
      [callerHash, calleeHash]
    );
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

  static preStateHash (execution) {
    const intermediateHash = ethers.utils.solidityKeccak256(
      [
        'bytes32',
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
        execution.storageRoot,
        execution.stateRoot,
        execution.accountHash
      ]
    );

    const envHash = ethers.utils.solidityKeccak256(
      [
        'bytes32',
        'uint256',
        // trick for CALL
        // 'uint256',
        'uint256',
        'uint256',
      ],
      [
        execution.logHash,
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

  makeLeave (executions, code, callData, tStorage/*, customEnvironmentHash*/) {
    if (!executions || !executions.length) {
      throw new Error('You need to pass at least one execution step');
    }
        
    const stateProof = executions[0].stateProof;
    const stateRoot = executions[0].stateRoot;
    const storageRoot = executions[0].storageRoot;
    const callerAccount = executions[0].callerAccount;
    const calleeAccount = executions[0].calleeAccount;
    const callValueProof = executions[0].callValueProof;
    const isCALLValue = executions[0].isCALLValue;
   
    if (!this.tree) {
      this.tree = [[]];
    }
   
    const initialState = this.constructor.initialStateHash(
      isCALLValue, callValueProof, callerAccount, calleeAccount, stateProof, stateRoot, storageRoot, code, callData, tStorage/*customEnvironmentHash*/
    );

    const leaves = this.tree[0];
    const callDataHash = this.constructor.dataHash(callData);

    let prevLeaf = { right: initialState };
    let len = executions.length;
    let memHash;
    let accountHash;
    let afterCallTemp;

    for (let i = 0; i < len; i++) {
     
      const exec = executions[i];
      
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

      accountHash = this.constructor.accountHash(exec.callerAccount, exec.calleeAccount);
      
       // convenience
       exec.memSize = exec.mem.length;
       exec.data = callData;
       exec.dataHash = callDataHash;
       exec.memHash = memHash;
       exec.accountHash = accountHash;
           
      // TODO: the runtime should ultimately support and supply that
      //  exec.customEnvironmentHash = customEnvironmentHash;
                      
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
              logHash,
              executionState: executions[i],
            },
            hash: this.constructor.hash(beforeStep.right.hash, hash),
            isLeaf: true,
            isFirstExecutionStep: isFirstExecutionStep,
            isEndExecutionStep: isEndExecutionStep,
            callDepth: exec.callDepth,
            code: code,
            callStart: false,
            callEnd: false,
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
          callStart: false,
          callEnd: false,
        };
             
        return obj;
      }
      
      if (exec.callDepth !== 0 && isFirstExecutionStep) {
        afterCallTemp = leaves[leaves.length-1];
        const beforeCall = recalLeaf(leaves[leaves.length-1].left, prevLeaf.right);
        beforeCall.callStart = true;
        // console.log('makeLeave', beforeCall)
        leaves[leaves.length-1] = beforeCall;
        const llen = pushLeaf(prevLeaf);
        prevLeaf = leaves[llen - 1];
        // console.log('makeLeave', prevLeaf)
      } else if (exec.callDepth !== 0 && isEndExecutionStep) {
        let llen = pushLeaf(prevLeaf);
        prevLeaf = leaves[llen - 1];
        const afterCall = recalLeaf(prevLeaf.right, afterCallTemp.right, false, true);
        // console.log('makeLeave prevLeaf', prevLeaf.right)
        // console.log('makeLeave afterCall', afterCallTemp.right);
        afterCall.callEnd = true;
        llen = leaves.push(afterCall);
        prevLeaf = leaves[llen - 1];
      } else {
        const llen = pushLeaf(prevLeaf);
        prevLeaf = leaves[llen - 1];
      }
     
      if (exec.isCALLExecuted) {
        const steps = exec.calleeSteps;
        const code = exec.calleeCode;
        const callData = exec.calleeCallData;
        const tStorage = exec.calleeTstorage;
             
        this.makeLeave(steps, code, callData, tStorage/*, customEnvironmentHash*/);    
      }
    }
  }

  run (executions, code, callData, tStorage/*, customEnvironmentHash*/) {
    this.makeLeave(executions, code, callData, tStorage/*, customEnvironmentHash*/);
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

  static async getStorageRoot(storage) {
    // console.log('getStorageRoot', storage)
      const storageTrie = new HexaryTrie();
        if (storage) {
          let storageLen = storage.length;
          
          for (let i = 0; i < storageLen - 1; i++) {
            if (i % 2 === 0) {
                let key = storage[i].replace('0x', '');
                let val = storage[i+1].replace('0x', '');
                
                await storageTrie.putData(key, val);
                // console.log('111key', key);
                // console.log('111val', val);
                
                
            }
          }
          const storageRoot = storageTrie.trie.root;
          return storageRoot;
      } else {
        return ZERO_HASH;
      }
  }
};
