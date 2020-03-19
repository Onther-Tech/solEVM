'use strict';

const utils = require('ethereumjs-util');
const BN = utils.BN;
const _ = require('lodash');

const OP = require('./constants');
const ethers = require('ethers');
const EVMRuntime = require('./EVMRuntime');
const RangeProofHelper = require('./RangeProofHelper');
const Merkelizer = require('./Merkelizer');

const toHex = arr => arr.map(e => '0x' + e.toString(16).padStart(64, '0'));

const OP_SWAP1 = parseInt(OP.SWAP1, 16);
const OP_SWAP16 = parseInt(OP.SWAP16, 16);
const OP_DUP1 = parseInt(OP.DUP1, 16);
const OP_DUP16 = parseInt(OP.DUP16, 16);

function HexToBuf (val) {
  val = val.replace('0x', '');
  return Buffer.from(val, 'hex');
}

module.exports = class HydratedRuntime extends EVMRuntime {
  async initRunState (obj) {
    const runState = await super.initRunState(obj);
    const stack = toHex(runState.stack);

    runState.steps = [];
    runState.prevStack = stack;
    runState.stackHashes = Merkelizer.stackHashes(stack);

    runState.memProof = new RangeProofHelper(runState.memory);
    runState.callDataProof = new RangeProofHelper(runState.callData);
    runState.codeProof = new RangeProofHelper(runState.code);
    runState.rawCode = runState.code; 
    runState.rawCallData = runState.callData; 
    runState.callData = runState.callDataProof.proxy;
    runState.memory = runState.memProof.proxy;
    runState.code = runState.codeProof.proxy;
    runState.tStorage = this.accounts[runState.depth].tStorage || [];
    runState.logHash = obj.logHash || OP.ZERO_HASH;
   
    // TODO: to get storage of callee contract for now, 
    // but it should be get storage from local db in future
    runState.calleeTstorage = (runState.depth < this.accounts.length - 1) 
    ? this.accounts[runState.depth + 1].tStorage : [];

    runState.storageProof = {};
    runState.storageRoot = this.accounts[runState.depth].storageRoot;

    if (runState.depth === 0) {
      // get stateProof at FirstStep
      runState.stateProof = _.cloneDeep(this.accounts[runState.depth].stateProof) || [];
      runState.stateRoot = _.cloneDeep(this.stateTrie.root);
    } else {
      // update stateProof of calllee at CALLStart(runState.depth > 0)
      this.accounts[runState.depth].stateProof.stateRoot = _.cloneDeep(this.stateTrie.root);
      const siblings = this.stateTrie.getProof(
        this.accounts[runState.depth].stateProof.hashedKey
      );
      this.accounts[runState.depth].stateProof.siblings = Buffer.concat(siblings);
      runState.stateProof = _.cloneDeep(this.accounts[runState.depth].stateProof);
      runState.stateRoot = _.cloneDeep(this.stateTrie.root);
    }
       
    console.log('initRunState', this.accounts[runState.depth]);
    return runState;
  }

  async run (args) {
    const runState = await super.run(args);

    // a temporay hack for our unit tests :/
    if (runState.steps.length > 0) {
      runState.steps[runState.steps.length - 1].stack = toHex(runState.stack);
    }
    return runState.steps;
  }

  async runNextStep (runState) {
    let pc = runState.programCounter;
    const callDataProof = runState.callDataProof;
    const codeProof = runState.codeProof;
    const gasLeft = runState.gasLeft.addn(0);

    callDataProof.reset();
    codeProof.reset();

    await super.runNextStep(runState);

    const opcode = runState.opCode;
    const returnData = '0x' + (runState.returnValue ? runState.returnValue.toString('hex') : '');

    // if we have no errors and opcode is not RETURN or STOP, update pc
    if (runState.errno === 0 && (opcode !== 0xf3 && opcode !== 0x00)) {
      pc = runState.programCounter;
    }

    const codeReads = codeProof.readAndWrites.filter(
      function (val) {
        return val < runState.code.length;
      }
    ).sort(
      function (a, b) {
        if (a < b) {
          return -1;
        }
        if (a > b) {
          return 1;
        }
        return 0;
      }
    );

    // if CALL set isCallExecuted true 
    let isCALLExecuted = false;
    let isCALLValue = false;
    let calleeSteps;
    let calleeCode;
    let calleeCallData;
    
    let callValueProof = {};
    if (runState.opName === 'CALL') {
      isCALLExecuted = true;
      calleeSteps = runState.calleeSteps;
      calleeCode = runState.calleeCode.toString('hex');
      calleeCallData = '0x' + runState.calleeCallData.toString('hex');
     
      // get call value from the stack
      const prevStack = runState.prevStack;
      const callValueStack = prevStack[prevStack.length-3];
      const callValue = parseInt(callValueStack);
      const stateTrie = this.stateTrie;
      
      // update stateProof for caller account at CALLEnd
      const caller = this.accounts[runState.depth];
      caller.stateProof.stateRoot = stateTrie.root;
      // console.log('caller', caller.stateProof.stateRoot)
      const siblings = stateTrie.getProof(caller.stateProof.hashedKey);
      caller.stateProof.siblings = Buffer.concat(siblings);
      const callerProof = caller.stateProof;
   
      // get stateProof for callee account at CALLEnd
      const callee = this.accounts[runState.depth+1];
      const calleeProof = callee.stateProof;
      
      if (callValue !== 0 ) {
        isCALLValue = true;
        
        const beforeRoot = _.cloneDeep(stateTrie.root);
        // console.log('HydratedRuntime', beforeRoot);
        const callerKey = callerProof.hashedKey;
        const callerBeforeLeaf = callerProof.leaf;
        const callerSiblings = callerProof.siblings;
       
        const calleeKey = calleeProof.hashedKey;
        const calleeBeforeLeaf = calleeProof.leaf;
        
        caller.balance -= callValue;
        callee.balance += callValue;
  
        // caller put data
        let rawVal = [];
        rawVal.push(caller.nonce);
        rawVal.push(caller.balance);
        rawVal.push(caller.codeHash);
        rawVal.push(caller.storageRoot);
        
        let rlpVal = utils.rlp.encode(rawVal);
        stateTrie.putData(callerKey, rlpVal);
        const intermediateRoot = _.cloneDeep(stateTrie.root);
        // console.log('HydratedRuntime', intermediateRoot);
        const callerAfterLeaf = stateTrie.hash(rlpVal);        
        // get proof from callee node at intermediateRoot
        const calleeSiblings = stateTrie.getProof(calleeKey);
        
        // callee put data 
        rawVal = [];
        rawVal.push(callee.nonce);
        rawVal.push(callee.balance);
        rawVal.push(callee.codeHash);
        rawVal.push(callee.storageRoot);
        
        rlpVal = utils.rlp.encode(rawVal);
        stateTrie.putData(calleeKey, rlpVal);
        const afterRoot = _.cloneDeep(stateTrie.root);
        // console.log('HydratedRuntime', afterRoot);
        const calleeAfterLeaf = stateTrie.hash(rlpVal);

        callValueProof.callerKey = callerKey;
        callValueProof.calleeKey = calleeKey;
        callValueProof.callerBeforeLeaf = callerBeforeLeaf;
        callValueProof.callerAfterLeaf = callerAfterLeaf;
        callValueProof.calleeBeforeLeaf = calleeBeforeLeaf;
        callValueProof.calleeAfterLeaf = calleeAfterLeaf;
        callValueProof.beforeRoot = beforeRoot;
        callValueProof.intermediateRoot = intermediateRoot;
        callValueProof.afterRoot = afterRoot;
        callValueProof.callerSiblings = callerSiblings;
        callValueProof.calleeSiblings = Buffer.concat(calleeSiblings);

        // attach callValueProof at CALLEnd
        const len = calleeSteps.length;
        calleeSteps[len-1].callValueProof = callValueProof;
        calleeSteps[len-1].isCALLValue = isCALLValue;
      }
      // update state root and state proof of caller.
      runState.stateRoot = stateTrie.root;
      runState.stateProof = callerProof;
    } 
    
    const step = {
      opCodeName: runState.opName,
      stack: toHex(runState.stack),
      callDataReadLow: callDataProof.readLow,
      callDataReadHigh: callDataProof.readHigh,
      codeReads: codeReads,
      returnData: returnData,
      pc: pc,
      errno: runState.errno,
      gasRemaining: runState.gasLeft.toNumber(),
      tStorage: runState.tStorage,
      isStorageReset: false,
      isStorageDataRequired: false,
      isStorageDataChanged: false,
      tStorageSize: 0,
      logs: runState.logs,
      logHash: runState.logHash,
      calleeCode: calleeCode || '',
      calleeCallData: calleeCallData || '',
      calleeTstorage: runState.calleeTstorage,
      isCALLExecuted: isCALLExecuted,
      calleeSteps: calleeSteps,
      callDepth: runState.depth,
      isCALLValue: isCALLValue,
      callValueProof: callValueProof,
      storageProof: {},
      storageRoot: runState.storageRoot,
      stateProof: runState.stateProof,
      stateRoot: runState.stateRoot,
    };
    
    this.calculateMemProof(runState, step);
    this.calculateStackProof(runState, step);
    if (runState.opName === 'SSTORE' || runState.opName === 'SLOAD') {
      await this.getStorageData(runState, step);
    }
    runState.steps.push(step);
  }

  async getStorageData (runState, step){
    const opcodeName = runState.opName;
    
    let isStorageDataRequired = false;
    let isStorageDataChanged = false;
    let isStorageReset = false;

      // support checkSumAddress
      const address = utils.toChecksumAddress(runState.address.toString('hex'));
     
      // get state trie for an account
      const stateTrie = this.stateTrie;
      
      // get storage trie for an account
      let storageTrie;
      for (let i = 0; i < this.accounts.length; i++){
        let checksumAddress;
        if (utils.isValidChecksumAddress(this.accounts[i].address)) {
          checksumAddress = this.accounts[i].address;
        } else {
          checksumAddress = utils.toChecksumAddress(this.accounts[i].address);
        }
        if (address === checksumAddress) {
          storageTrie = this.accounts[i].storageTrie;
        }
     }
     
     if( opcodeName === 'SSTORE' ){
      
      try {
        let newStorageData = await this.getStorageValue(runState, step.compactStack);
       
        const key = HexToBuf(newStorageData[0]);
        const val = HexToBuf(newStorageData[1]);
               
        const hashedKey = storageTrie.hash(key);
                
        let copyArr = _.cloneDeep(runState.tStorage);
        for (let i = 0; i < runState.tStorage.length; i++){
          if ( i % 2 == 0 && runState.tStorage[i] === newStorageData[0] ){
            isStorageReset = true;
            copyArr[i+1] = newStorageData[1];
          }
        }
        if (!isStorageReset) {
          copyArr = copyArr.concat(newStorageData);
         
          const EMPTY_VALUE = utils.zeros(32);
          storageTrie.putData(hashedKey, val);
          const siblings = storageTrie.getProof(hashedKey);
          let obj = {};
          obj.storageRoot = _.cloneDeep(storageTrie.root);
          obj.hashedKey = hashedKey;
          obj.beforeLeaf = EMPTY_VALUE;
          obj.afterLeaf = storageTrie.hash(val);
          obj.siblings = Buffer.concat(siblings);
                 
          runState.storageRoot = _.cloneDeep(storageTrie.root);
          runState.storageProof = obj;
        }

        runState.tStorage = copyArr;
        isStorageDataRequired = true;
        isStorageDataChanged = true;
      } catch (error) {
        console.log(error);
      }

      try {
        // calaulate stateRoot and proof 
        const account = this.accounts[runState.depth];
        account.storageRoot = _.cloneDeep(storageTrie.root);
        const bufAddress = HexToBuf(account.address);
        const hashedKey = stateTrie.hash(bufAddress);
        const val = [];
        val.push(account.nonce);
        val.push(account.balance);
        val.push(account.codeHash);
        val.push(account.storageRoot);
        
        const rlpVal = utils.rlp.encode(val);
        
        stateTrie.putData(hashedKey, rlpVal);
        let elem = {};
        const siblings = stateTrie.getProof(hashedKey);
        elem.hashedKey = hashedKey;
        elem.leaf = stateTrie.hash(rlpVal);
        elem.stateRoot = _.cloneDeep(stateTrie.root);
        elem.siblings = Buffer.concat(siblings);
                
        runState.stateRoot = _.cloneDeep(stateTrie.root);
        runState.stateProof = elem;
        // update stateProof at SSTORE
        this.accounts[runState.depth].stateProof = elem;
      } catch (error) {
        console.log(error);
      }
    }

    let isStorageLoaded = false;
    if ( opcodeName === 'SLOAD' ){
      
      isStorageDataRequired = true;
      let newStorageData = await this.getStorageValue(runState, step.compactStack);
      
      for (let i = 0; i < runState.tStorage.length - 1; i++){
        if ( i % 2 == 0 && runState.tStorage[i] === newStorageData[0] ){
          isStorageLoaded = true;
          break;
        } 
      }
      if (!isStorageLoaded) {
        runState.tStorage = runState.tStorage.concat(newStorageData);
      } 
  }
    
    step.tStorage = runState.tStorage;
    step.isStorageReset = isStorageReset;
    step.isStorageDataRequired = isStorageDataRequired;
    step.isStorageDataChanged = isStorageDataChanged;
    step.tStorageSize = runState.tStorage.length;
    step.storageRoot = runState.storageRoot;
    step.storageProof = runState.storageProof;
    step.stateRoot = runState.stateRoot;
    step.stateProof = runState.stateProof;
  }

  async getStorageValue(runState, compactStack) {
    let stateManager = runState.stateManager;
    let address = runState.address;
    // console.log('HydratedRuntime', address);
    let key = compactStack[compactStack.length - 1];
    key = Buffer.from(key.replace('0x', ''), 'hex');
    
    return new Promise(
      function (resolve, reject) {
            
        const cb = function (err, result) {
            if (err) {
              reject(err)
              return;
            }
           
            let elem = [];
            key = '0x' + key.toString('hex');
            result = result.length ? new BN(result) : new BN(0);
            result = '0x' + result.toString(16).padStart(64, '0');
            
            elem.push(key);
            elem.push(result);
            resolve(elem);
        };
        
        stateManager.getContractStorage(address, key, cb);   

        return;
              
      }
    )
  }

  calculateMemProof (runState, step) {
    const memProof = runState.memProof;
    const prevMem = runState.prevMem;
    const memSize = runState.memoryWordCount.toNumber();

    // serialize the memory if it changed
    if (memProof.readHigh !== -1 || memProof.writeHigh !== -1 || !prevMem || prevMem.length !== memSize) {
      const mem = [];
      const memStore = runState.memProof.data;

      let i = 0;
      while (i < memStore.length) {
        const hexVal = Buffer.from(memStore.slice(i, i += 32)).toString('hex');
        mem.push('0x' + hexVal.padEnd(64, '0'));
      }
      // fill the remaing zero slots
      while (mem.length < memSize) {
        mem.push(OP.ZERO_HASH);
      }
      step.mem = mem;
      runState.prevMem = mem;
    } else {
      step.mem = prevMem;
    }

    step.memReadLow = memProof.readLow;
    step.memReadHigh = memProof.readHigh;
    step.memWriteLow = memProof.writeLow;
    step.memWriteHigh = memProof.writeHigh;

    memProof.reset();
  }

  calculateStackProof (runState, step) {
    const opcode = runState.opCode;
    let stackIn = runState.stackIn | 0;

    if (opcode >= OP_SWAP1 && opcode <= OP_SWAP16) {
      stackIn = (16 - (OP_SWAP16 - opcode)) * 2;
    }

    if (opcode >= OP_DUP1 && opcode <= OP_DUP16) {
      stackIn = 16 - (OP_DUP16 - opcode);
    }

    // can happen on error - clip here
    if (stackIn > runState.prevStack.length) {
      stackIn = runState.prevStack.length;
    }

    // if stack changed
    if (stackIn !== 0 || runState.prevStack.length !== runState.stack.length) {
      // elements needed
      step.compactStack = new Array(stackIn);

      // remove the number of 'consumed' elements - if any
      while (stackIn--) {
        step.compactStack[stackIn] = runState.prevStack.pop();
        runState.stackHashes.pop();
      }

      // add the new/changed elements - if any
      const newElements = [];
      for (let i = runState.prevStack.length; i < runState.stack.length; i++) {
        let val = '0x' + runState.stack[i].toString(16).padStart(64, '0');
        runState.prevStack.push(val);
        newElements.push(val);
      }
      step.compactStackHash = runState.stackHashes[runState.stackHashes.length - 1];

      const partialHashes = Merkelizer.stackHashes(newElements, step.compactStackHash);
      // first element of partialHash is alread in the list
      runState.stackHashes = runState.stackHashes.concat(partialHashes.slice(1, partialHashes.length));
    } else {
      step.compactStackHash = runState.stackHashes[runState.stackHashes.length - 1];
      step.compactStack = [];
    }

    step.stackHash = runState.stackHashes[runState.stackHashes.length - 1];
    step.stackSize = runState.stack.length;
  }

  async handleLOG (runState) {
    await super.handleLOG(runState);

    let prevLogHash = runState.logHash;
    let log = runState.logs[runState.logs.length - 1];

    if (!log) {
      throw new Error('step with LOGx opcode but no log emitted');
    }

    let topics = log[1];
    while (topics.length !== 4) {
      topics.push(0);
    }
    runState.logHash = ethers.utils.solidityKeccak256(
      ['bytes32', 'address', 'uint[4]', 'bytes'],
      [
        prevLogHash,
        '0x' + log[0].toString('hex'),
        topics,
        '0x' + log[2].toString('hex'),
      ]
    );
  }

  async handleJUMP (runState) {
    await super.handleJUMP(runState);

    runState.codeProof.readAndWrites.push(runState.programCounter);
  }

  async handleJUMPI (runState) {
    await super.handleJUMPI(runState);

    runState.codeProof.readAndWrites.push(runState.programCounter);
  }
};
