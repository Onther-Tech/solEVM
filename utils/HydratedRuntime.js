'use strict';

const utils = require('ethereumjs-util');
const BN = utils.BN;

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
    runState.stateManager = runState.stateManager.copy();
    runState.initStorageProof = this.accounts[runState.depth].initStorageProof || [];
    runState.intermediateStorageProof = [];
    runState.intermediateStorageRoot = this.accounts[runState.depth].storageHash || OP.ZERO_HASH;
    // console.log('initRunState', this.accounts[runState.depth].storageHash)
    return runState;
  }

  async run (args) {
    const runState = await super.run(args);

    // a temporay hack for our unit tests :/
    if (runState.steps.length > 0) {
      runState.steps[runState.steps.length - 1].stack = toHex(runState.stack);
    }
    return [runState.initStorageProof, runState.steps];
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
    let calleeCode;
    let calleeCallData;
    let calleeTstorage;
    let calleeProof;
    if (opcode === 0xf1) {
      isCALLExecuted = true;
      calleeCode = runState.calleeCode.toString('hex');
      calleeCallData = '0x' + runState.calleeCallData.toString('hex');
      calleeTstorage = runState.calleeTstorage;
      calleeProof = runState.calleeProof;
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
      tStorageSize: 0,
      logs: runState.logs,
      logHash: runState.logHash,
      calleeCode: calleeCode || '',
      calleeCallData: calleeCallData || '',
      calleeTstorage: calleeTstorage || [],
      calleeProof: calleeProof,
      isCALLExecuted: isCALLExecuted,
      calleeSteps: runState.calleeSteps,
      callDepth: runState.depth,
      intermediateStorageRoot: runState.intermediateStorageRoot,
      initStorageProof: runState.initStorageProof,
      intermediateStorageProof: runState.intermediateStorageProof
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
    let isStorageReset = false;

     // pick storage trie for an account
     const address = runState.address.toString('hex');
     let storageTrie;
     for (let i = 0; i < this.accounts.length; i++){
       if (address === this.accounts[i].address) {
         storageTrie = this.accounts[i].storageTrie;
       }
     }
    
    if( opcodeName === 'SSTORE' ){
      try {
        let newStorageData = await this.getStorageValue(runState, step.compactStack);
        let key = newStorageData[0].toString();
        let val = newStorageData[1].toString();
        
        key = key.replace('0x', '');
        val = val.replace('0x', '');

        await storageTrie.putData(key, val);
        // let data = await storageTrie.getData(key)
        // console.log('data', data);
        let arr = [];
        let obj = {};
        const {rootHash, hashedKey, stack} = await storageTrie.getProof(key);
        obj.rootHash = rootHash;
        obj.key = key;
        obj.val = val;
        obj.hashedKey = hashedKey;
        obj.stack = stack;
        arr.push(obj);

        runState.intermediateStorageRoot = '0x' + rootHash.toString('hex');
        runState.intermediateStorageProof = arr;
        
        // console.log('rootHash', rootHash);
        // console.log('hashedKey', hashedKey);
        // console.log('stack', stack);
        for (let i = 0; i < runState.tStorage.length; i++){
          if ( i % 2 == 0 && runState.tStorage[i] === newStorageData[0] ){
            isStorageReset = true;
            runState.tStorage[i+1] = newStorageData[1];
          }
        }
        if (!isStorageReset){
          runState.tStorage = runState.tStorage.concat(newStorageData);
        }
        isStorageDataRequired = true;
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
        } 
      }
      if (!isStorageLoaded) {
        runState.tStorage = runState.tStorage.concat(newStorageData);
      }

      let key = newStorageData[0].toString();
      let val = newStorageData[1].toString();

      key = key.replace('0x', '');
      val = val.replace('0x', '');

      let arr = [];
      let obj = {};
      const {rootHash, hashedKey, stack} = await storageTrie.getProof(key);
      obj.rootHash = rootHash;
      obj.key = key;
      obj.val = val;
      obj.hashedKey = hashedKey;
      obj.stack = stack;
      arr.push(obj);
      runState.intermediateStorageProof = arr;
  }
    
    step.tStorage = runState.tStorage;
    step.isStorageReset = isStorageReset;
    step.isStorageDataRequired = isStorageDataRequired;
    step.tStorageSize = runState.tStorage.length;
    step.intermediateStorageRoot = runState.intermediateStorageRoot;
    step.intermediateStorageProof = runState.intermediateStorageProof;
  }

  async getStorageValue(runState, compactStack) {
    let stateManager = runState.stateManager;
    let address = runState.address;
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
            result = '0x' + result.toString(16);
            
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
