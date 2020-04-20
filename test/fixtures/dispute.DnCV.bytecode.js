'use strict';

const HydratedRuntime = require('./../../utils/HydratedRuntime');
const Merkelizer = require('../../utils/Merkelizer');
const OP = require('../../utils/constants');
const debug = require('debug')('dispute-test');
const web3 = require('web3');
const _ = require('lodash');
const SMT = require('../../utils/smt/SparseMerkleTrie').SMT;
const FragmentTree = require('../../utils/FragmentTree');
const utils = require('ethereumjs-util');
const BN = utils.BN;
function HexToBuf (val) {
  val = val.replace('0x', '');
  return Buffer.from(val, 'hex');
}

module.exports = (callback) => {
  describe('Fixture for Dispute/Verifier Logic #1', function () {    
    
    // caller
    const code = '6080604052600436106100705760003560e01c806367e404ce1161004e57806367e404ce1461029157806385f5e190146102e85780639d927bd9146103e7578063e5ba9ef5146104e657610070565b8063179fe784146100755780632e52d606146101675780633d2d78c814610192575b600080fd5b6100e16004803603606081101561008b57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506105e5565b604051808315151515815260200180602001828103825283818151815260200191508051906020019080838360005b8381101561012b578082015181840152602081019050610110565b50505050905090810190601f1680156101585780820380516001836020036101000a031916815260200191505b50935050505060405180910390f35b34801561017357600080fd5b5061017c61076f565b6040518082815260200191505060405180910390f35b34801561019e57600080fd5b5061020b600480360360608110156101b557600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610775565b604051808315151515815260200180602001828103825283818151815260200191508051906020019080838360005b8381101561025557808201518184015260208101905061023a565b50505050905090810190601f1680156102825780820380516001836020036101000a031916815260200191505b50935050505060405180910390f35b34801561029d57600080fd5b506102a6610901565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b3480156102f457600080fd5b506103616004803603606081101561030b57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610927565b604051808315151515815260200180602001828103825283818151815260200191508051906020019080838360005b838110156103ab578082015181840152602081019050610390565b50505050905090810190601f1680156103d85780820380516001836020036101000a031916815260200191505b50935050505060405180910390f35b3480156103f357600080fd5b506104606004803603606081101561040a57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610ab1565b604051808315151515815260200180602001828103825283818151815260200191508051906020019080838360005b838110156104aa57808201518184015260208101905061048f565b50505050905090810190601f1680156104d75780820380516001836020036101000a031916815260200191505b50935050505060405180910390f35b3480156104f257600080fd5b5061055f6004803603606081101561050957600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610c3b565b604051808315151515815260200180602001828103825283818151815260200191508051906020019080838360005b838110156105a957808201518184015260208101905061058e565b50505050905090810190601f1680156105d65780820380516001836020036101000a031916815260200191505b50935050505060405180910390f35b60006060600060608673ffffffffffffffffffffffffffffffffffffffff168686604051602401808373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001828152602001925050506040516020818303038152906040527f565902c5000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040518082805190602001908083835b6020831015156106fb57805182526020820191506020810190506020830392506106d6565b6001836020036101000a038019825116818451168082178552505050505050905001915050600060405180830381855af49150503d806000811461075b576040519150601f19603f3d011682016040523d82523d6000602084013e610760565b606091505b50915091505050935093915050565b60005481565b60006060600060608673ffffffffffffffffffffffffffffffffffffffff168686604051602401808373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001828152602001925050506040516020818303038152906040527f7174830f000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040518082805190602001908083835b60208310151561088b5780518252602082019150602081019050602083039250610866565b6001836020036101000a0380198251168184511680821785525050505050509050019150506000604051808303816000865af19150503d80600081146108ed576040519150601f19603f3d011682016040523d82523d6000602084013e6108f2565b606091505b50915091505050935093915050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60006060600060608673ffffffffffffffffffffffffffffffffffffffff168686604051602401808373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001828152602001925050506040516020818303038152906040527f7174830f000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040518082805190602001908083835b602083101515610a3d5780518252602082019150602081019050602083039250610a18565b6001836020036101000a038019825116818451168082178552505050505050905001915050600060405180830381855af49150503d8060008114610a9d576040519150601f19603f3d011682016040523d82523d6000602084013e610aa2565b606091505b50915091505050935093915050565b60006060600060608673ffffffffffffffffffffffffffffffffffffffff168686604051602401808373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001828152602001925050506040516020818303038152906040527fb2cd18b4000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040518082805190602001908083835b602083101515610bc75780518252602082019150602081019050602083039250610ba2565b6001836020036101000a038019825116818451168082178552505050505050905001915050600060405180830381855af49150503d8060008114610c27576040519150601f19603f3d011682016040523d82523d6000602084013e610c2c565b606091505b50915091505050935093915050565b60006060600060608673ffffffffffffffffffffffffffffffffffffffff168686604051602401808373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001828152602001925050506040516020818303038152906040527fb2cd18b4000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040518082805190602001908083835b602083101515610d515780518252602082019150602081019050602083039250610d2c565b6001836020036101000a0380198251168184511680821785525050505050509050019150506000604051808303816000865af19150503d8060008114610db3576040519150601f19603f3d011682016040523d82523d6000602084013e610db8565b606091505b5091509150505093509391505056fea165627a7a72305820f4c77c1fc392392bf71499979622c5840bb3b084539b724bfbd90e0be3dec42c0029';
    const data = '0x179fe78400000000000000000000000061002ea22196c8df447cc71b5e6c2a190e67cc14000000000000000000000000ae8c6a1d94ce2de718ca1d1e5746673ab7092c2300000000000000000000000000000000000000000000000000000000000003e8';
    const tStorage = [];

    // callee1
    const calleeCode1 = '60806040526004361061004a5760003560e01c80632e52d6061461004f578063565902c51461007a57806367e404ce146100c85780637174830f1461011f578063b2cd18b41461017a575b600080fd5b34801561005b57600080fd5b506100646101d5565b6040518082815260200191505060405180910390f35b6100c66004803603604081101561009057600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506101db565b005b3480156100d457600080fd5b506100dd610245565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b34801561012b57600080fd5b506101786004803603604081101561014257600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061026b565b005b34801561018657600080fd5b506101d36004803603604081101561019d57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506103b9565b005b60005481565b8173ffffffffffffffffffffffffffffffffffffffff168160405180600001905060006040518083038185875af1925050503d8060008114610239576040519150601f19603f3d011682016040523d82523d6000602084013e61023e565b606091505b5050505050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600060608373ffffffffffffffffffffffffffffffffffffffff1683604051602401808281526020019150506040516020818303038152906040527f3f7a0270000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040518082805190602001908083835b6020831015156103495780518252602082019150602081019050602083039250610324565b6001836020036101000a038019825116818451168082178552505050505050905001915050600060405180830381855af49150503d80600081146103a9576040519150601f19603f3d011682016040523d82523d6000602084013e6103ae565b606091505b509150915050505050565b600060608373ffffffffffffffffffffffffffffffffffffffff1683604051602401808281526020019150506040516020818303038152906040527f3f7a0270000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040518082805190602001908083835b6020831015156104975780518252602082019150602081019050602083039250610472565b6001836020036101000a0380198251168184511680821785525050505050509050019150506000604051808303816000865af19150503d80600081146104f9576040519150601f19603f3d011682016040523d82523d6000602084013e6104fe565b606091505b50915091505050505056fea165627a7a7230582056913c30dd3761eea374e81e3cf63388878aa964b1754aaa61bab4d551bc7d480029';
    const calleeTstorage1 = [];

    // callee2
    const calleeCode2 = '60806040526004361061003f5760003560e01c806312065fe0146100415780632e52d6061461006c5780633f7a02701461009757806367e404ce146100d2575b005b34801561004d57600080fd5b50610056610129565b6040518082815260200191505060405180910390f35b34801561007857600080fd5b50610081610148565b6040518082815260200191505060405180910390f35b3480156100a357600080fd5b506100d0600480360360208110156100ba57600080fd5b810190808035906020019092919050505061014e565b005b3480156100de57600080fd5b506100e7610199565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b60003073ffffffffffffffffffffffffffffffffffffffff1631905090565b60005481565b8060008190555033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff168156fea165627a7a72305820969c26f623378084e09edc3bdef3783d305ffa52b9085d132bdb254b842231520029'
    const calleeTstorage2 = [];

    const accounts = [
        // caller
        {
          address: '0xA5A5193Fb9A523157430740FbA64Cbb5c3d9228C',
          nonce: new BN(0x1, 16),
          balance: new BN(0x1000, 16),
          code: code,
          tStorage: tStorage
        },
        // callee1
        {
            address: '0x61002EA22196c8dF447cC71B5e6c2a190e67CC14',
            nonce: new BN(0x1, 16),
            balance: new BN(0x1000, 16),
            code: calleeCode1,
            tStorage: calleeTstorage1
        },
          // callee2
        {
            address: '0xaE8C6a1D94CE2DE718cA1d1E5746673aB7092c23',
            nonce: new BN(0x1, 16),
            balance: new BN(0x1000, 16),
            code: calleeCode2,
            tStorage: calleeTstorage2
        },
    ];
    const wrongCode = '608060405234801561001057600080fd5b50600436106100575760003560e01c80632e52d6061461005c5780635e01eb5a1461007a57806367e404ce146100c45780637174830f1461010e578063b2cd18b41461015c575b600080fd5b6100646101aa565b6040518082815260200191505060405180910390f35b6100826101b0565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6100cc6101da565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b61015a6004803603604081101561012457600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610200565b005b6101a86004803603604081101561017257600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061034e565b005b60005481565b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600060608373ffffffffffffffffffffffffffffffffffffffff1683604051602401808281526020019150506040516020818303038152906040527f3f7a0270000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040518082805190602001908083835b6020831015156102de57805182526020820191506020810190506020830392506102b9565b6001836020036101000a038019825116818451168082178552505050505050905001915050600060405180830381855af49150503d806000811461033e576040519150601f19603f3d011682016040523d82523d6000602084013e610343565b606091505b509150915050505050565b600060608373ffffffffffffffffffffffffffffffffffffffff1683604051602401808281526020019150506040516020818303038152906040527f3f7a0270000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040518082805190602001908083835b60208310151561042c5780518252602082019150602081019050602083039250610407565b6001836020036101000a0380198251168184511680821785525050505050509050019150506000604051808303816000865af19150503d806000811461048e576040519150601f19603f3d011682016040523d82523d6000602084013e610493565b606091505b50915091505050505056fea165627a7a72305820e5e115e20a05bd7786bf8103a4b83278f4af7afc4bb4a63bab92c9107669707c0029';
    const storageRoot = '0xa7ff9e28ffd3def443d324547688c2c4eb98edf7da757d6bfa22bff55b9ce24a';
    
    let steps;
    let copy;
    let calleeCopy1;
    let calleeCopy2;
    let merkle;
    
    let smt;

    let caller;
    let callee;

    let callerKey;
    let calleeKey;

    let callerVal;
    let calleeVal;

    let callerRlpVal;
    let calleeRlpVal;

    beforeEach(async () => {
      const runtime = new HydratedRuntime();
      steps = await runtime.run({ accounts, code, data, pc: 0, tStorage: tStorage, stepCount: 355 });
      copy = _.cloneDeep(steps);
      // opcode DELEGATECALL 264, CALL 86 
      calleeCopy1 = _.cloneDeep(steps[264].calleeSteps);
      calleeCopy2 = _.cloneDeep(steps[264].calleeSteps[86].calleeSteps);
      merkle = new Merkelizer().run(steps, code, data, tStorage);

      smt = new SMT();
     
      caller = accounts[0];
      callee = accounts[2];

      callerKey = smt.hash('0x' + caller.address);
      calleeKey = smt.hash('0x' + callee.address);
      
      caller.storageRoot = '0xa7ff9e28ffd3def443d324547688c2c4eb98edf7da757d6bfa22bff55b9ce24a';
      callee.storageRoot = '0xa7ff9e28ffd3def443d324547688c2c4eb98edf7da757d6bfa22bff55b9ce24a';
      
      const callerFragmentTree = new FragmentTree().run(caller.code);
      caller.codeHash = callerFragmentTree.root.hash;
      const calleeFragmentTree = new FragmentTree().run(callee.code);
      callee.codeHash = calleeFragmentTree.root.hash;
     
      callerVal = [
        caller.nonce, caller.balance, caller.codeHash, caller.storageRoot
      ];
      calleeVal = [
        callee.nonce, callee.balance, callee.codeHash, callee.storageRoot
      ];

      callerRlpVal = utils.rlp.encode(callerVal);
      calleeRlpVal = utils.rlp.encode(calleeVal);
      smt.putData(callerKey, callerRlpVal);
      smt.putData(calleeKey, calleeRlpVal);

      // console.log(smt.root);
    });

    it('solver manipulate stateRoot #1 - replace with wrong value at CALLStart', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep1 = calleeCopy1;
      const wrongCalleeStep2 = calleeCopy2;
     
      const wrongVal = 900;
     
      // set wrong rlpVal
      callerVal[1] -= wrongVal;
      calleeVal[1] += wrongVal;
      // console.log('callerVal', callerVal)
      // console.log('calleeVal', calleeVal)

      const callerRlpVal = utils.rlp.encode(callerVal);
      const calleeRlpVal = utils.rlp.encode(calleeVal);

      // put wrong val
      smt.putData(callerKey, callerRlpVal);
      smt.putData(calleeKey, calleeRlpVal);

      // get wrong rootHash
      const rootHash = smt.root;
      // console.log('rootHash', rootHash);

      // set wrong stateRoot
      wrongCalleeStep2[0].stateRoot = rootHash;
      wrongCalleeStep2[0].callValueProof.afterRoot = rootHash;
      wrongCalleeStep1[86].calleeSteps = wrongCalleeStep2;
      wrongExecution[264].calleeSteps = wrongCalleeStep1;

      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger manipulate stateRoot #1 - replace with wrong value at CALLStart', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep1 = calleeCopy1;
      const wrongCalleeStep2 = calleeCopy2;
     
      const wrongVal = 900;
     
      // set wrong rlpVal
      callerVal[1] -= wrongVal;
      calleeVal[1] += wrongVal;
      // console.log('callerVal', callerVal)
      // console.log('calleeVal', calleeVal)

      const callerRlpVal = utils.rlp.encode(callerVal);
      const calleeRlpVal = utils.rlp.encode(calleeVal);

      // put wrong val
      smt.putData(callerKey, callerRlpVal);
      smt.putData(calleeKey, calleeRlpVal);

      // get wrong rootHash
      const rootHash = smt.root;
      // console.log('rootHash', rootHash);

      // set wrong stateRoot
      wrongCalleeStep2[0].stateRoot = rootHash;
      wrongCalleeStep2[0].callValueProof.afterRoot = rootHash;
      wrongCalleeStep1[86].calleeSteps = wrongCalleeStep2;
      wrongExecution[264].calleeSteps = wrongCalleeStep1;
      
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver manipulate stateRoot #2 - add wrong value at CALLStart', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep1 = calleeCopy1;
      const wrongCalleeStep2 = calleeCopy2;

      // set correct val - 1000
      const correctVal = 1000;

      // get correct rlpVal
      callerVal[1] -= correctVal;
      calleeVal[1] += correctVal;
      // console.log('callerVal', callerVal)
      // console.log('calleeVal', calleeVal)
      
      const callerRlpVal = utils.rlp.encode(callerVal);
      const calleeRlpVal = utils.rlp.encode(calleeVal);

      // put correct val
      smt.putData(callerKey, callerRlpVal);
      smt.putData(calleeKey, calleeRlpVal);

      // put wrong val
      const wrongKey = utils.keccak256('0');
      const wrongRlpVal = callerRlpVal;
      smt.putData(wrongKey, wrongRlpVal);

      // get wrong rootHash
      const rootHash = smt.root;
      // console.log('rootHash', rootHash);

      // set wrong stateRoot
      wrongCalleeStep2[0].stateRoot = rootHash;
      wrongCalleeStep2[0].callValueProof.afterRoot = rootHash;
      wrongCalleeStep1[86].calleeSteps = wrongCalleeStep2;
      wrongExecution[264].calleeSteps = wrongCalleeStep1;

      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger manipulate stateRoot #2 - add wrong value at CALLStart', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep1 = calleeCopy1;
      const wrongCalleeStep2 = calleeCopy2;

      // set correct val - 1000
      const correctVal = 1000;

      // get correct rlpVal
      callerVal[1] -= correctVal;
      calleeVal[1] += correctVal;
      // console.log('callerVal', callerVal)
      // console.log('calleeVal', calleeVal)
      
      const callerRlpVal = utils.rlp.encode(callerVal);
      const calleeRlpVal = utils.rlp.encode(calleeVal);

      // put correct val
      smt.putData(callerKey, callerRlpVal);
      smt.putData(calleeKey, calleeRlpVal);

      // put wrong val
      const wrongKey = utils.keccak256('0');
      const wrongRlpVal = callerRlpVal;
      smt.putData(wrongKey, wrongRlpVal);

      // get wrong rootHash
      const rootHash = smt.root;
      // console.log('rootHash', rootHash);

      // set wrong stateRoot
      wrongCalleeStep2[0].stateRoot = rootHash;
      wrongCalleeStep2[0].callValueProof.afterRoot = rootHash;
      wrongCalleeStep1[86].calleeSteps = wrongCalleeStep2;
      wrongExecution[264].calleeSteps = wrongCalleeStep1;

      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });
  });
};
