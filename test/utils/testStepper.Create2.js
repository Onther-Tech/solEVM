'use strict';

const HydratedRuntime = require('./../../utils/HydratedRuntime');
const Merkelizer = require('../../utils/Merkelizer');
const OP = require('../../utils/constants');
const debug = require('debug')('dispute-test');
const utils = require('ethereumjs-util');
const BN = utils.BN;

// caller
const code = '608060405234801561001057600080fd5b50600436106100415760003560e01c80630bd38f2f146100465780637133b0641461007e578063e332e6c1146100c8575b600080fd5b61007c6004803603604081101561005c57600080fd5b810190808035906020019092919080359060200190929190505050610112565b005b610086610329565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6100d061034e565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b60ff60f81b30836040518060200161012990610374565b6020820181038252601f19601f82011660405250846040516020018083805190602001908083835b602083106101745780518252602082019150602081019050602083039250610151565b6001836020036101000a038019825116818451168082178552505050505050905001828152602001925050506040516020818303038152906040528051906020012060405160200180857effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff19167effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff191681526001018473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1660601b81526014018381526020018281526020019450505050506040516020818303038152906040528051906020012060601c600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600082826040516102b790610374565b808281526020019150508190604051809103906000f59050801580156102e1573d6000803e3d6000fd5b509050806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550505050565b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60df806103818339019056fe608060405234801561001057600080fd5b506040516100df3803806100df8339818101604052602081101561003357600080fd5b8101908080519060200190929190505050806000819055505060858061005a6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80630c55699c14602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000548156fea26469706673582212200075a6935ae1a8e69cac7a8e97695ed5b5c681c3fb05f2c42f5b168b0aa15b7c64736f6c63430006060033a264697066735822122084afc4a45d61f4c451bf88705a4bf458789b91c631531946ff932ab2d3cc8bd164736f6c63430006060033';
const data = '0x0bd38f2f00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001';
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
    // console.log(steps[0].stateRoot.toString('hex'));
    // console.log(steps[0].runtimeStackHash);
    // console.log(steps[0].runtimeAccount);
    // console.log(steps[0].bytecodeAccount);
    for (let i = 0; i < steps.length - 1; i++){
        // console.log(steps[i].runtimeStackHash);
        if (steps[i].opCodeName === 'SSTORE') {
            console.log('depth 0', i)
        }
        if (steps[i].opCodeName === 'CREATE2') {
            console.log('CREATE2', i);
            console.log('depth 0', steps[i-1].runtimeStackHash)
            let calleeSteps1 = steps[i].calleeSteps;
            for (let i = 0; i < calleeSteps1.length - 1; i++){
                // console.log(calleeSteps1[i].runtimeStackHash)
                if (calleeSteps1[i].opCodeName === 'SSTORE') {
                    console.log('SSTORE', i);
                   
                }
            }
        //    console.log(calleeSteps1[calleeSteps1.length - 1])
        //    console.log(calleeSteps1[0])
        }
        
    }
    // console.log(steps[steps.length-1], steps.length-1);
   
    merkle = await new Merkelizer().run(steps, code, data, tStorage);
    // console.log(merkle.tree[0][521])
    // console.log(merkle.printLeave());
})();