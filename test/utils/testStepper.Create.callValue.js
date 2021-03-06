'use strict';

const HydratedRuntime = require('./../../utils/HydratedRuntime');
const Merkelizer = require('../../utils/Merkelizer');
const OP = require('../../utils/constants');
const debug = require('debug')('dispute-test');
const utils = require('ethereumjs-util');
const BN = utils.BN;

// caller
const code = '6080604052600436106100295760003560e01c806395fe0e651461002e578063db3297f614610069575b600080fd5b34801561003a57600080fd5b506100676004803603602081101561005157600080fd5b8101908080359060200190929190505050610097565b005b6100956004803603602081101561007f57600080fd5b8101908080359060200190929190505050610155565b005b6000816040516100a690610216565b80828152602001915050604051809103906000f0801580156100cc573d6000803e3d6000fd5b5090508073ffffffffffffffffffffffffffffffffffffffff16630c55699c6040518163ffffffff1660e01b815260040160206040518083038186803b15801561011557600080fd5b505afa158015610129573d6000803e3d6000fd5b505050506040513d602081101561013f57600080fd5b8101908080519060200190929190505050505050565b6000600a8260405161016690610216565b808281526020019150506040518091039082f090508015801561018d573d6000803e3d6000fd5b5090508073ffffffffffffffffffffffffffffffffffffffff16630c55699c6040518163ffffffff1660e01b815260040160206040518083038186803b1580156101d657600080fd5b505afa1580156101ea573d6000803e3d6000fd5b505050506040513d602081101561020057600080fd5b8101908080519060200190929190505050505050565b60d1806102238339019056fe60806040526040516100d13803806100d183398181016040526020811015602557600080fd5b8101908080519060200190929190505050806000819055505060858061004c6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80630c55699c14602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000548156fea26469706673582212208c4ee9c41b2aef1eefa79607644336305efce0c269f832f05826c8eb52fd556864736f6c63430006060033a26469706673582212206c3acb730270e3ecbd9fca9529ed45b58c1b9476c052c949a4f7e93fdfeecfb964736f6c63430006060033';
const data = '0xdb3297f6000000000000000000000000000000000000000000000000000000000000000a';
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
        if (steps[i].opCodeName === 'CREATE') {
            console.log('CREATE', i);
            let calleeSteps1 = steps[i].calleeSteps;
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