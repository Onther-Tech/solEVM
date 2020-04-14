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
    runState.isCALL = false;
    runState.isDELEGATECALL = false;
            
    if (runState.depth === 0) {
      // get stateRoot at FirstStep
      runState.stateRoot = _.cloneDeep(this.stateTrie.root);

      // get caller account but if there is callee account, get callee account too. 
      // if there isn't callee account, initialize with zero. 
      runState.callerAccount = _.cloneDeep(this.accounts[runState.depth].stateProof);
      runState.calleeAccount = {};
      if (this.accounts[runState.depth+1]) {
        runState.calleeAccount = _.cloneDeep(this.accounts[runState.depth+1].stateProof);
      } else {
        runState.calleeAccount.addr = '0x' + '0'.padStart(40,0);
        runState.calleeAccount.rlpVal = OP.ZERO_HASH;
        runState.calleeAccount.stateRoot = '0x' + '0'.padStart(64,0);
        runState.calleeAccount.siblings = '0x';
      }
      
    } else {
      // update stateProof at CALLStart(runState.depth > 0).
      const beforeRuntimeAddress = this.runtimeAddress;
      const currentRuntimeAddress = utils.toChecksumAddress(runState.address.toString('hex'));

      let caller;
      let callee;
      if (currentRuntimeAddress === beforeRuntimeAddress) {
        // delegateCall
        runState.isDELEGATECALL = true;
        for (let i = 0; i < this.accounts.length; i++) {
          if (currentRuntimeAddress === this.accounts[i].address) {
            caller = _.cloneDeep(this.accounts[i]);
            callee = _.cloneDeep(this.accounts[runState.depth]);
          }
        }
      } else {
        // call
        runState.isCALL = true;
        for (let i = 0; i < this.accounts.length; i++) {
          if (beforeRuntimeAddress === this.accounts[i].address) {
            caller = _.cloneDeep(this.accounts[i]);
            callee = _.cloneDeep(this.accounts[runState.depth]);
          }
        }
      }
         
      const callerObj = {};
      callerObj.addr =  caller.address;
      callerObj.rlpVal = caller.stateProof.rlpVal;
      callerObj.stateRoot = _.cloneDeep(this.stateTrie.root);
      callerObj.siblings = Buffer.concat(
        this.stateTrie.getProof(this.stateTrie.hash(callerObj.addr))
      );

      for (let i = 0; i < this.accounts.length; i++) {
        if (callerObj.addr === this.accounts[i].address) {
          this.accounts[i].stateProof = callerObj;
        }
      }

      // this.accounts[runState.depth-1].stateProof = callerObj;

      const calleeObj = {};
      calleeObj.addr =  callee.address;
      calleeObj.rlpVal = callee.stateProof.rlpVal;
      calleeObj.stateRoot = _.cloneDeep(this.stateTrie.root);
      calleeObj.siblings = Buffer.concat(
        this.stateTrie.getProof(this.stateTrie.hash(calleeObj.addr))
      );
      for (let i = 0; i < this.accounts.length; i++) {
        if (calleeObj.addr === this.accounts[i].address) {
          this.accounts[i].stateProof = calleeObj;
        }
      }
      // this.accounts[runState.depth].stateProof = calleeObj;

      runState.callerAccount = callerObj
      runState.calleeAccount = calleeObj;
     
      runState.previousCallerAccount = _.cloneDeep(this.previousCallerAccount);
      runState.previousCalleeAccount = _.cloneDeep(this.previousCalleeAccount);
            
      runState.stateRoot = _.cloneDeep(this.stateTrie.root);

      // console.log('HydratedRuntime', runState.callerAccount);
      const callValue = new BN(runState.callValue, 16);
      const callValueProof = {};
     
      if (!callValue.isZero()) {
        runState.isCALLValue = true;
        const stateTrie = this.stateTrie;

        let caller;
        let callee;
        for (let i = 0; i < this.accounts.length; i++) {
          if (this.accounts[i].address === runState.callerAccount.addr) {
            caller = _.cloneDeep(this.accounts[i]);
          } else if (this.accounts[i].address === runState.calleeAccount.addr) {
            callee = _.cloneDeep(this.accounts[i]);
          }
        }
        runState.beforeCalleeAccount = _.cloneDeep(callee.stateProof);
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
        const callerVal = [];
        callerVal.push(caller.nonce);
        callerVal.push(caller.balance);
        callerVal.push(caller.codeHash);
        callerVal.push(callerStorageRoot);
       
        const callerRlpVal = utils.rlp.encode(callerVal);
      
        // caller putData
        stateTrie.putData(callerKey, callerRlpVal);
        const intermediateRoot = _.cloneDeep(stateTrie.root);
        const callerAfterLeaf = stateTrie.hash(callerRlpVal);
                
        // get proof from callee node at intermediateRoot
        const calleeSiblings = Buffer.concat(stateTrie.getProof(calleeKey));

        // callee put data 
        const calleeVal = [];
        calleeVal.push(callee.nonce);
        calleeVal.push(callee.balance);
        calleeVal.push(callee.codeHash);
        calleeVal.push(callee.storageRoot);
        
        const calleeRlpVal = utils.rlp.encode(calleeVal);
       
        // callee putData
        stateTrie.putData(calleeKey, calleeRlpVal);
        const afterRoot = _.cloneDeep(stateTrie.root);
        const calleeAfterLeaf = stateTrie.hash(calleeRlpVal);
        
        // update caller account
        const callerObj = {};
        callerObj.addr = caller.address;
        callerObj.rlpVal = callerRlpVal;
        callerObj.stateRoot = _.cloneDeep(stateTrie.root);
        callerObj.siblings = Buffer.concat(
          stateTrie.getProof(stateTrie.hash(callerObj.addr))
        );
        runState.callerAccount = callerObj;
        // this.accounts[runState.depth-1].stateProof = callerObj;

        // update callee account
        const calleeObj = {};
        calleeObj.addr = callee.address;
        calleeObj.rlpVal = calleeRlpVal;
        calleeObj.stateRoot = _.cloneDeep(stateTrie.root);
        calleeObj.siblings = Buffer.concat(
          stateTrie.getProof(stateTrie.hash(calleeObj.addr))
        );
        runState.calleeAccount = calleeObj;
        // this.accounts[runState.depth].stateProof = calleeObj;

         // update account
         for (let i = 0; i < this.accounts.length; i++) {
          if (runState.callerAccount.addr === this.accounts[i].address) {
            this.accounts[i].stateProof = callerObj;
          } else if (runState.calleeAccount.addr === this.accounts[i].address) {
            this.accounts[i].stateProof = calleeObj;
          }
        }
                      
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
    // reserve runtimeAddress for distinguishing CALL and DELEGATECALL
    this.runtimeAddress = _.cloneDeep(utils.toChecksumAddress(runState.address.toString('hex')));
    this.previousCallerAccount =  _.cloneDeep(runState.callerAccount);
    this.previousCalleeAccount = _.cloneDeep(runState.calleeAccount);
    // console.log(this.callerContract);
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

    const runtimeAddress = utils.toChecksumAddress(runState.address.toString('hex'));

    let isCALLExecuted = false;
    let calleeSteps;
    let calleeCode;
    let calleeCallData;
    
    if (runState.opName === 'CALL' || runState.opName === 'DELEGATECALL' || runState.opName === 'STATICCALL') {
      isCALLExecuted = true;
      calleeSteps = runState.calleeSteps;
      calleeCode = runState.calleeCode.toString('hex');
      calleeCallData = '0x' + runState.calleeCallData.toString('hex');
                
      const stateTrie = this.stateTrie;
      
      // update stateProof at callEnd
      let caller;
      let callee;
      let one;
      let theOther;
     
      for (let i = 0; i < this.accounts.length; i++) {
        if (this.accounts[i].address === runState.callerAccount.addr) {
          caller = _.cloneDeep(this.accounts[i]);
        } else if (this.accounts[i].address === runState.calleeAccount.addr) {
          callee = _.cloneDeep(this.accounts[i]);
        }
      }
    
      if (runtimeAddress === caller.address) {
        one = caller;
        theOther = callee;
      } else {
        one = callee;
        theOther = caller;
      }
     
      const storageTrie1 = one.storageTrie;
      
      const rawVal1 = [];
      rawVal1.push(one.nonce);
      rawVal1.push(one.balance);
      rawVal1.push(one.codeHash);
      rawVal1.push(_.cloneDeep(storageTrie1.root));
            
      const rlpVal1 = utils.rlp.encode(rawVal1);
    
      const obj1 = {};
      obj1.addr = one.address;
      obj1.rlpVal = rlpVal1;
      obj1.stateRoot = _.cloneDeep(stateTrie.root);
      obj1.siblings = Buffer.concat(
        stateTrie.getProof(stateTrie.hash(obj1.addr))
      );

      const storageTrie2 = theOther.storageTrie;
      
      const rawVal2 = [];
      rawVal2.push(theOther.nonce);
      rawVal2.push(theOther.balance);
      rawVal2.push(theOther.codeHash);
      rawVal2.push(_.cloneDeep(storageTrie2.root));
            
      const rlpVal2 = utils.rlp.encode(rawVal2);

      const obj2 = {};
      obj2.addr = theOther.address;
      obj2.rlpVal = rlpVal2;
      obj2.stateRoot = _.cloneDeep(stateTrie.root);
      obj2.siblings = Buffer.concat(
        stateTrie.getProof(stateTrie.hash(obj2.addr))
      );

      runState.stateRoot = _.cloneDeep(stateTrie.root);

      if (runState.isCALL) {
        runState.callerAccount = obj2; 
        runState.calleeAccount = obj1; 
        for (let i = 0; i < this.accounts.length; i++) {
          if (runState.callerAccount.addr === this.accounts[i].address) {
            this.accounts[i].stateProof = obj2;
          } else if (runState.calleeAccount.addr === this.accounts[i].address) {
            this.accounts[i].stateProof = obj1;
          }
        }
        // this.accounts[runState.depth-1].stateProof = obj2;
        // this.accounts[runState.depth].stateProof = obj1;
      } else if (runState.isDELEGATECALL || runState.depth === 0) {
        runState.callerAccount = obj1;
        runState.calleeAccount = obj2;
        for (let i = 0; i < this.accounts.length; i++) {
          if (runState.callerAccount.addr === this.accounts[i].address) {
            this.accounts[i].stateProof = obj1;
          } else if (runState.calleeAccount.addr === this.accounts[i].address) {
            this.accounts[i].stateProof = obj2;
          }
        }
        // this.accounts[runState.depth].stateProof = obj1;
        // this.accounts[runState.depth+1].stateProof = obj2;
      }
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
      isCALL: runState.isCALL,
      isDELEGATECALL: runState.isDELEGATECALL,
      isCALLValue: runState.isCALLValue,
      callValueProof: runState.callValueProof || {},
      storageProof: {},
      storageRoot: runState.storageRoot,
      stateRoot: runState.stateRoot,
      callerAccount: runState.callerAccount,
      calleeAccount: runState.calleeAccount,
      beforeCalleeAccount: runState.beforeCalleeAccount || {},
      previousCallerAccount: runState.previousCallerAccount || {},
      previousCalleeAccount: runState.previousCalleeAccount || {}
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
    const runtimeAddress = utils.toChecksumAddress(runState.address.toString('hex'));
    
    // get state trie for an account
    const stateTrie = this.stateTrie;
    
    // get storage trie for an account
    let storageTrie;
    for (let i = 0; i < this.accounts.length; i++){
      if (runtimeAddress === this.accounts[i].address) {
        storageTrie = this.accounts[i].storageTrie;
      }
    }
  
    if(opcodeName === 'SSTORE') {
       
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
      let caller;
      let callee;
      let one;
      let theOther;
      for (let i = 0; i < this.accounts.length; i++) {
        if (this.accounts[i].address === runState.callerAccount.addr) {
          caller = this.accounts[i];
        } else if (this.accounts[i].address === runState.calleeAccount.addr) {
          callee = this.accounts[i];
        }
      }
    
      if (runtimeAddress === caller.address) {
        // delegatecall
        one = caller;
        theOther = callee;
      } else {
        // call
        one = callee;
        theOther = caller;
      }
   
      // console.log(account.address)
      one.storageRoot = _.cloneDeep(storageTrie.root);
      const bufAddress = HexToBuf(one.address);
      const oneHashedKey = stateTrie.hash(bufAddress);
      
      const rawVal1 = [];
      rawVal1.push(one.nonce);
      rawVal1.push(one.balance);
      rawVal1.push(one.codeHash);
      rawVal1.push(one.storageRoot);
            
      const rlpVal1 = utils.rlp.encode(rawVal1);

      stateTrie.putData(oneHashedKey, rlpVal1);
     
      const obj1 = {};
      obj1.addr = one.address;
      obj1.rlpVal = rlpVal1;
      obj1.stateRoot = _.cloneDeep(stateTrie.root);
      obj1.siblings = Buffer.concat(
        stateTrie.getProof(stateTrie.hash(obj1.addr))
      );
     
      let obj2 = {};
      let rawVal2;
    
      if (theOther !== undefined) {
       
        rawVal2 = [];
        rawVal2.push(theOther.nonce);
        rawVal2.push(theOther.balance);
        rawVal2.push(theOther.codeHash);
        rawVal2.push(theOther.storageRoot);
  
        const rlpVal2 = utils.rlp.encode(rawVal2);
  
        obj2.addr = theOther.address;
        obj2.rlpVal = rlpVal2;
        obj2.stateRoot = _.cloneDeep(stateTrie.root);
        obj2.siblings = Buffer.concat(
          stateTrie.getProof(stateTrie.hash(obj2.addr))
        );
      } else {
        obj2.addr = '0x' + '0'.padStart(40,0);
        obj2.rlpVal = OP.ZERO_HASH;
        obj2.stateRoot = '0x' + '0'.padStart(64,0);
        obj2.siblings = '0x';
      }
                       
      runState.stateRoot = _.cloneDeep(stateTrie.root);
          
      // update account at SSTORE
      if (runtimeAddress === runState.callerAccount.addr) {
        runState.callerAccount = obj1;
        runState.calleeAccount = obj2;
        // update account
        for (let i = 0; i < this.accounts.length; i++) {
          if (runState.callerAccount.addr === this.accounts[i].address) {
            this.accounts[i].stateProof = obj1;
          } else if (runState.calleeAccount.addr === this.accounts[i].address) {
            this.accounts[i].stateProof = obj2;
          }
        }
      } else if (runtimeAddress === runState.calleeAccount.addr) {
        runState.callerAccount = obj2;
        runState.calleeAccount = obj1;
        
        // update account
        for (let i = 0; i < this.accounts.length; i++) {
          if (runState.callerAccount.addr === this.accounts[i].address) {
            this.accounts[i].stateProof = obj2;
          } else if (runState.calleeAccount.addr === this.accounts[i].address) {
            this.accounts[i].stateProof = obj1;
          }
        }
        // this.accounts[runState.depth-1].stateProof = obj2;
        // this.accounts[runState.depth].stateProof = obj1;
      }
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
