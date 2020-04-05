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
    
    runState.isCALLValue = false;

    if (runState.depth === 0) {
      // get stateProof at FirstStep
      runState.stateProof = _.cloneDeep(this.accounts[runState.depth].stateProof);
      runState.stateRoot = _.cloneDeep(this.stateTrie.root);

      // get caller account but if there is callee account, get callee account too. 
      // if there isn't callee account, initialize with zero. 
      runState.callerAccount = {};
      runState.callerAccount.addr = this.accounts[runState.depth].address;
      runState.callerAccount.rlpVal = _.cloneDeep(this.accounts[runState.depth].rlpVal);
      runState.calleeAccount = {};
      if (this.accounts[runState.depth + 1]) {
        runState.calleeAccount.addr = this.accounts[runState.depth + 1].address;
        runState.calleeAccount.rlpVal = _.cloneDeep(this.accounts[runState.depth + 1].rlpVal);
      } else {
        runState.calleeAccount.addr = '0x' + '0'.padStart(40,0);
        runState.calleeAccount.rlpVal = '0x';
      }
    } else {
      // update stateProof of callee at CALLStart(runState.depth > 0).
      // we don't have to update stateProof of caller because it aleady has been updated. 
      this.accounts[runState.depth].stateProof.stateRoot = _.cloneDeep(this.stateTrie.root);
      const siblings = this.stateTrie.getProof(
        this.accounts[runState.depth].stateProof.hashedKey
      );
      this.accounts[runState.depth].stateProof.siblings = Buffer.concat(siblings);

      // get stateProof at CALLStart
      runState.stateProof = _.cloneDeep(this.accounts[runState.depth].stateProof);
      runState.stateRoot = _.cloneDeep(this.stateTrie.root);

      // get caller account and callee account.
      runState.callerAccount = {};
      runState.callerAccount.addr = this.accounts[runState.depth-1].address;
      runState.callerAccount.rlpVal = _.cloneDeep(this.accounts[runState.depth-1].rlpVal);
      runState.calleeAccount = {};
      runState.calleeAccount.addr = this.accounts[runState.depth].address;
      runState.calleeAccount.rlpVal = _.cloneDeep(this.accounts[runState.depth].rlpVal);
          
      const callValue = new BN(runState.callValue, 16);
     
      const callValueProof = {};
     
      if (!callValue.isZero()) {
        runState.isCALLValue = true;
        const stateTrie = this.stateTrie;
      
        // get caller account
        const caller = this.accounts[runState.depth-1];
            
        // get callee account 
        const callee = this.accounts[runState.depth];
        
        const beforeRoot = _.cloneDeep(stateTrie.root);
        const callerKey = stateTrie.hash(HexToBuf(caller.address));
        const callerBeforeLeaf = stateTrie.hash(runState.callerAccount.rlpVal);
        const callerSiblings = Buffer.concat(stateTrie.getProof(callerKey));
        const callerStorageRoot = _.cloneDeep(caller.storageTrie.root);
        const calleeKey = stateTrie.hash(HexToBuf(callee.address));
        const calleeBeforeLeaf = stateTrie.hash(runState.calleeAccount.rlpVal);
        
        caller.balance.isub(callValue);
        callee.balance.iadd(callValue);
        
        // caller put data
        let rawVal = [];
        rawVal.push(caller.nonce);
        rawVal.push(caller.balance);
        rawVal.push(caller.codeHash);
        rawVal.push(callerStorageRoot);
       
        let rlpVal = utils.rlp.encode(rawVal);
        
        stateTrie.putData(callerKey, rlpVal);
        const intermediateRoot = _.cloneDeep(stateTrie.root);
        
        const callerAfterLeaf = stateTrie.hash(rlpVal);
                
        // get proof from callee node at intermediateRoot
        const calleeSiblings = Buffer.concat(stateTrie.getProof(calleeKey));

        // update caller account
        let obj = {};
        obj.addr = caller.address;
        obj.rlpVal = rlpVal;
        runState.callerAccount = obj;
        
        // callee put data 
        rawVal = [];
        rawVal.push(callee.nonce);
        rawVal.push(callee.balance);
        rawVal.push(callee.codeHash);
        rawVal.push(callee.storageRoot);
        
        rlpVal = utils.rlp.encode(rawVal);
        stateTrie.putData(calleeKey, rlpVal);
        const afterRoot = _.cloneDeep(stateTrie.root);
        const calleeAfterLeaf = stateTrie.hash(rlpVal);
       
        // update callee account
        obj = {};
        obj.addr = callee.address;
        obj.rlpVal = rlpVal;
        runState.calleeAccount = obj;
                 
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
        callValueProof.calleeSiblings = calleeSiblings; 
        
        runState.callValueProof = callValueProof;    
        runState.stateRoot = _.cloneDeep(stateTrie.root);
      }
    }
    return runState;
  }

  // async getAccountBalance(runState, address) {
  //   const stateManager = runState.stateManager;
          
  //   return new Promise(
  //     function (resolve, reject) {
            
  //       const cb = function (err, account) {
  //           if (err) {
  //             reject(err)
  //             return;
  //           }
  //           resolve(account.raw);
  //       };
        
  //       stateManager.getAccount(address, cb);   

  //       return;
  //     }
  //   )
  // }
  
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

    let isCALLExecuted = false;
    let calleeSteps;
    let calleeCode;
    let calleeCallData;
    
    if (runState.opName === 'CALL' || runState.opName === 'DELEGATECALL') {
      isCALLExecuted = true;
      calleeSteps = runState.calleeSteps;
      calleeCode = runState.calleeCode.toString('hex');
      calleeCallData = '0x' + runState.calleeCallData.toString('hex');
                
      const stateTrie = this.stateTrie;
      
      // get caller account at CALLEnd
      const caller = this.accounts[runState.depth];
         
      // update stateRoot and stateProof
      const callerKey = stateTrie.hash(HexToBuf(caller.address));
      const callerBeforeLeaf = stateTrie.hash(runState.callerAccount.rlpVal);
      const callerSiblings = Buffer.concat(stateTrie.getProof(callerKey));
           
      let obj = {};
      obj.hashedKey = callerKey;
      obj.leaf = callerBeforeLeaf;
      obj.stateRoot = _.cloneDeep(stateTrie.root);
      obj.siblings = callerSiblings;

      runState.stateProof = obj;
      runState.stateRoot = _.cloneDeep(stateTrie.root);
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
      calleeTstorage: runState.calleeTstorage || '',
      isCALLExecuted: isCALLExecuted,
      calleeSteps: calleeSteps,
      callDepth: runState.depth,
      isCALLValue: runState.isCALLValue,
      callValueProof: runState.callValueProof || {},
      storageProof: {},
      storageRoot: runState.storageRoot,
      stateProof: runState.stateProof,
      stateRoot: runState.stateRoot,
      callerAccount: runState.callerAccount,
      calleeAccount: runState.calleeAccount
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
      if (address === this.accounts[i].address) {
        storageTrie = this.accounts[i].storageTrie;
      }
    }
    //  console.log(address)
    //  console.log(this.accounts[0].address)
    if( opcodeName === 'SSTORE' ){
      let newStorageData = await this.getStorageValue(runState, step.compactStack);
      
      const key = HexToBuf(newStorageData[0]);
      const val = HexToBuf(newStorageData[1]);
      
      const hashedKey = storageTrie.hash(key);
              
      let copyArr = _.cloneDeep(runState.tStorage);
      let beforeVal;
      for (let i = 0; i < runState.tStorage.length; i++){
        if ( i % 2 == 0 && runState.tStorage[i] === newStorageData[0] ){
          if ( parseInt(copyArr[i+1]) !== 0){
            isStorageReset = true;
            beforeVal = _.cloneDeep(copyArr[i+1]);
            copyArr[i+1] = _.cloneDeep(newStorageData[1]);
          }
        }
      }
      let obj = {};
      const EMPTY_VALUE = utils.zeros(32);
      if (!isStorageReset) {
        copyArr = copyArr.concat(newStorageData);
                
        storageTrie.putData(hashedKey, val);
        const siblings = storageTrie.getProof(hashedKey);
      
        obj.storageRoot = _.cloneDeep(storageTrie.root);
        obj.hashedKey = hashedKey;
        obj.beforeLeaf = EMPTY_VALUE;
        obj.afterLeaf = storageTrie.hash(val);
        obj.siblings = Buffer.concat(siblings);
      } else {
        storageTrie.putData(hashedKey, val);
        const siblings = storageTrie.getProof(hashedKey);
        beforeVal = HexToBuf(beforeVal);
              
        obj.storageRoot = _.cloneDeep(storageTrie.root);
        obj.hashedKey = hashedKey;
        obj.beforeLeaf = storageTrie.hash(beforeVal);
        obj.afterLeaf = storageTrie.hash(val);
        obj.siblings = Buffer.concat(siblings);
      }

      runState.tStorage = copyArr;
      isStorageDataRequired = true;
      isStorageDataChanged = true;
      runState.storageRoot = _.cloneDeep(storageTrie.root);
      runState.storageProof = obj;
    
      // calaulate stateRoot and proof 
      const account = this.accounts[runState.depth];
      const addr = this.accounts[runState.depth].address;
      account.storageRoot = _.cloneDeep(storageTrie.root);
      const bufAddress = HexToBuf(account.address);
      const accHashedKey = stateTrie.hash(bufAddress);
      
      const rawVal = [];
      rawVal.push(account.nonce);
      rawVal.push(account.balance);
      rawVal.push(account.codeHash);
      rawVal.push(account.storageRoot);
            
      const rlpVal = utils.rlp.encode(rawVal);

      obj = {};
      obj.addr = addr;
      obj.rlpVal = rlpVal;

      // update account at SSTORE
      if (runState.depth === 0) {
        runState.callerAccount = obj;
      } else {
        runState.calleeAccount = obj;
      }

      stateTrie.putData(accHashedKey, rlpVal);

      let elem = {};
      const siblings = stateTrie.getProof(accHashedKey);
      elem.hashedKey = accHashedKey;
      elem.leaf = stateTrie.hash(rlpVal);
      elem.stateRoot = _.cloneDeep(stateTrie.root);
      elem.siblings = Buffer.concat(siblings);
              
      runState.stateRoot = _.cloneDeep(stateTrie.root);
      runState.stateProof = elem;

      // update account
      this.accounts[runState.depth].stateProof = elem;
      this.accounts[runState.depth].rlpVal = rlpVal;
    } 
  
    let isStorageLoaded = false;
    if ( opcodeName === 'SLOAD' ) {
      
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
    step.callerAccount = runState.callerAccount;
    step.calleeAccount = runState.calleeAccount;
  }

  async getStorageValue(runState, compactStack) {
    const stateManager = runState.stateManager;
    const address = runState.address;
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
