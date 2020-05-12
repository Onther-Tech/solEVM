'use strict';

const HydratedRuntime = require('./../../utils/HydratedRuntime');
const Merkelizer = require('../../utils/Merkelizer');
const OP = require('../../utils/constants');
const debug = require('debug')('dispute-test');
const utils = require('ethereumjs-util');
const BN = utils.BN;

// caller
const code = '6080604052600436106100295760003560e01c806395fe0e651461002e578063e92f917614610069575b600080fd5b34801561003a57600080fd5b506100676004803603602081101561005157600080fd5b81019080803590602001909291905050506100a1565b005b61009f6004803603604081101561007f57600080fd5b81019080803590602001909291908035906020019092919050505061015f565b005b6000816040516100b090610226565b80828152602001915050604051809103906000f0801580156100d6573d6000803e3d6000fd5b5090508073ffffffffffffffffffffffffffffffffffffffff16630c55699c6040518163ffffffff1660e01b815260040160206040518083038186803b15801561011f57600080fd5b505afa158015610133573d6000803e3d6000fd5b505050506040513d602081101561014957600080fd5b8101908080519060200190929190505050505050565b600081600a8460405161017190610226565b8082815260200191505082906040518091039083f5905090508015801561019c573d6000803e3d6000fd5b5090508073ffffffffffffffffffffffffffffffffffffffff16630c55699c6040518163ffffffff1660e01b815260040160206040518083038186803b1580156101e557600080fd5b505afa1580156101f9573d6000803e3d6000fd5b505050506040513d602081101561020f57600080fd5b810190808051906020019092919050505050505050565b60d1806102338339019056fe60806040526040516100d13803806100d183398181016040526020811015602557600080fd5b8101908080519060200190929190505050806000819055505060858061004c6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80630c55699c14602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000548156fea2646970667358221220084bd8f97f4d5a652b73889570e925e9e235438d4d278444c991371d4cc9a36e64736f6c63430006060033a26469706673582212209c01b817d1f033b338090859604bdc1a19fe4a637be281e7c1a8547b58d7761e64736f6c63430006060033';
const data = '0xe92f9176000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000001';
const tStorage = [];

const accounts = [
    // caller
    {
      address: '0x9069B7d897B6f66332D15821aD2f95609c81E59a',
      code: code,
      tStorage: tStorage,
      nonce: new BN(0x2, 16),
      balance: new BN(0x64, 16),
      storageRoot: OP.ZERO_HASH,
      codeHash: OP.ZERO_HASH
    },
];

let steps;
let copy;
let calleeCopy;
let merkle;
const runtime = new HydratedRuntime();

(async function(){
    steps = await runtime.run({ accounts, code, data, tStorage: tStorage, pc: 0 });
    console.log(steps[0].stateRoot.toString('hex'));
    console.log(steps[0].runtimeStackHash);
    // console.log(steps[0].runtimeAccount);
    // console.log(steps[0].bytecodeAccount);
    // console.log(steps[135].opCodeName);
    for (let i = 0; i < steps.length - 1; i++){
        console.log(steps[i].stateRoot.toString('hex'), i);
        if (steps[i].opCodeName === 'SLOAD') {
            console.log('depth 0 SLOAD', i);
        }
        if (steps[i].opCodeName === 'SSTORE') {
            console.log('depth 0 SSTORE', i);
        }
        if (steps[i].opCodeName === 'CREATE2') {
            console.log('CREATE2', i);
            let calleeSteps1 = steps[i].calleeSteps;
            console.log(steps[i].calleeCode);
            for (let i = 0; i < calleeSteps1.length - 1; i++){
                console.log(calleeSteps1[i].stateRoot, i);
                if (calleeSteps1[i].opCodeName === 'SSTORE') {
                    console.log('depth 1 SSTORE', i);
                }
            }
                    
            // console.log(calleeSteps1[calleeSteps1.length-1], calleeSteps1.length-1);
        }
        if (steps[i].opCodeName === 'STATICCALL') {
            console.log('STATICCALL', i);
            let calleeSteps1 = steps[i].calleeSteps;
            // console.log(calleeSteps1[0], i);
            for (let i = 0; i < calleeSteps1.length - 1; i++){
                console.log(calleeSteps1[i].stateRoot, i);
                if (calleeSteps1[i].opCodeName === 'SSTORE') {
                    console.log('depth 1 SSTORE', i);
                }
            }
                    
            // console.log(calleeSteps1[calleeSteps1.length-1].callDepth, calleeSteps1.length-1);
        }
    }
    // console.log(steps[steps.length-1], steps.length-1);
   
    merkle = await new Merkelizer().run(steps, code, data, tStorage);
    // console.log(merkle.tree[0][521])
    // console.log(merkle.printLeave());
})();