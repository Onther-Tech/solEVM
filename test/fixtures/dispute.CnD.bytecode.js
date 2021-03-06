'use strict';

const HydratedRuntime = require('../../utils/HydratedRuntime');
const Merkelizer = require('../../utils/Merkelizer');
const FragmentTree = require('../../utils/FragmentTree');
const utils = require('ethereumjs-util');
const BN = utils.BN;
const OP = require('../../utils/constants');
const debug = require('debug')('dispute-test');
const _ = require('lodash');

module.exports = (callback) => {
  describe('Fixture for Dispute/Verifier Logic #1', function () {    
    
  // caller
    const code = '608060405234801561001057600080fd5b50600436106100625760003560e01c80632e52d606146100675780633d2d78c81461008557806367e404ce1461017757806385f5e190146101c15780639d927bd9146102b3578063e5ba9ef5146103a5575b600080fd5b61006f610497565b6040518082815260200191505060405180910390f35b6100f16004803603606081101561009b57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061049d565b604051808315151515815260200180602001828103825283818151815260200191508051906020019080838360005b8381101561013b578082015181840152602081019050610120565b50505050905090810190601f1680156101685780820380516001836020036101000a031916815260200191505b50935050505060405180910390f35b61017f610629565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b61022d600480360360608110156101d757600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061064f565b604051808315151515815260200180602001828103825283818151815260200191508051906020019080838360005b8381101561027757808201518184015260208101905061025c565b50505050905090810190601f1680156102a45780820380516001836020036101000a031916815260200191505b50935050505060405180910390f35b61031f600480360360608110156102c957600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506107d9565b604051808315151515815260200180602001828103825283818151815260200191508051906020019080838360005b8381101561036957808201518184015260208101905061034e565b50505050905090810190601f1680156103965780820380516001836020036101000a031916815260200191505b50935050505060405180910390f35b610411600480360360608110156103bb57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610963565b604051808315151515815260200180602001828103825283818151815260200191508051906020019080838360005b8381101561045b578082015181840152602081019050610440565b50505050905090810190601f1680156104885780820380516001836020036101000a031916815260200191505b50935050505060405180910390f35b60005481565b60006060600060608673ffffffffffffffffffffffffffffffffffffffff168686604051602401808373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001828152602001925050506040516020818303038152906040527f7174830f000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040518082805190602001908083835b6020831015156105b3578051825260208201915060208101905060208303925061058e565b6001836020036101000a0380198251168184511680821785525050505050509050019150506000604051808303816000865af19150503d8060008114610615576040519150601f19603f3d011682016040523d82523d6000602084013e61061a565b606091505b50915091505050935093915050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60006060600060608673ffffffffffffffffffffffffffffffffffffffff168686604051602401808373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001828152602001925050506040516020818303038152906040527f7174830f000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040518082805190602001908083835b6020831015156107655780518252602082019150602081019050602083039250610740565b6001836020036101000a038019825116818451168082178552505050505050905001915050600060405180830381855af49150503d80600081146107c5576040519150601f19603f3d011682016040523d82523d6000602084013e6107ca565b606091505b50915091505050935093915050565b60006060600060608673ffffffffffffffffffffffffffffffffffffffff168686604051602401808373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001828152602001925050506040516020818303038152906040527fb2cd18b4000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040518082805190602001908083835b6020831015156108ef57805182526020820191506020810190506020830392506108ca565b6001836020036101000a038019825116818451168082178552505050505050905001915050600060405180830381855af49150503d806000811461094f576040519150601f19603f3d011682016040523d82523d6000602084013e610954565b606091505b50915091505050935093915050565b60006060600060608673ffffffffffffffffffffffffffffffffffffffff168686604051602401808373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001828152602001925050506040516020818303038152906040527fb2cd18b4000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040518082805190602001908083835b602083101515610a795780518252602082019150602081019050602083039250610a54565b6001836020036101000a0380198251168184511680821785525050505050509050019150506000604051808303816000865af19150503d8060008114610adb576040519150601f19603f3d011682016040523d82523d6000602084013e610ae0565b606091505b5091509150505093509391505056fea165627a7a723058202ccf4213c5d2371566a2571bf1aa7c0f9e855bfd67fdb46b3650e449d0df7aef0029';
    const data = '0x3d2d78c8000000000000000000000000e3632b9ab0571d2601e804dfddc65eb51ab19310000000000000000000000000dcb77b866fe07451e8f89871edb27b27af9f2afc000000000000000000000000000000000000000000000000000000000000000a';
    const tStorage = [];

    // callee1
    const calleeCode1 = '608060405234801561001057600080fd5b506004361061004c5760003560e01c80632e52d6061461005157806367e404ce1461006f5780637174830f146100b9578063b2cd18b414610107575b600080fd5b610059610155565b6040518082815260200191505060405180910390f35b61007761015b565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b610105600480360360408110156100cf57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610181565b005b6101536004803603604081101561011d57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506102cf565b005b60005481565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600060608373ffffffffffffffffffffffffffffffffffffffff1683604051602401808281526020019150506040516020818303038152906040527f3f7a0270000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040518082805190602001908083835b60208310151561025f578051825260208201915060208101905060208303925061023a565b6001836020036101000a038019825116818451168082178552505050505050905001915050600060405180830381855af49150503d80600081146102bf576040519150601f19603f3d011682016040523d82523d6000602084013e6102c4565b606091505b509150915050505050565b600060608373ffffffffffffffffffffffffffffffffffffffff1683604051602401808281526020019150506040516020818303038152906040527f3f7a0270000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040518082805190602001908083835b6020831015156103ad5780518252602082019150602081019050602083039250610388565b6001836020036101000a0380198251168184511680821785525050505050509050019150506000604051808303816000865af19150503d806000811461040f576040519150601f19603f3d011682016040523d82523d6000602084013e610414565b606091505b50915091505050505056fea165627a7a72305820a6aeefeebc5cb1fcd339f23b757b8bd1cfde1097b753c8e92a98a29604bdf7660029';
    const calleeTstorage1 = [];

    // callee2
    const calleeCode2 = '608060405234801561001057600080fd5b50600436106100415760003560e01c80632e52d606146100465780633f7a02701461006457806367e404ce14610092575b600080fd5b61004e6100dc565b6040518082815260200191505060405180910390f35b6100906004803603602081101561007a57600080fd5b81019080803590602001909291905050506100e2565b005b61009a61012d565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b60005481565b8060008190555033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff168156fea165627a7a72305820f1b948be4224c3b5b07103ae7dbd9afaf60e6fa11041cd603ba73bfba9dd437c0029'
    const calleeTstorage2 = [];

    const accounts = [
        // caller
        {
          address: '0x5C3c1540Dfcd795B0aca58A496e3c30FE2405B07',
          code: code,
          tStorage: tStorage,
          nonce: new BN(0x1, 16),
          balance: new BN(0x64, 16),
          storageRoot: OP.ZERO_HASH,
          codeHash: OP.ZERO_HASH
        },
        // callee1
        {
            address: '0xe3632B9aB0571d2601e804DfDDc65EB51AB19310',
            code: calleeCode1,
            tStorage: calleeTstorage1,
            nonce: new BN(0x1, 16),
            balance: new BN(0x64, 16),
            storageRoot: OP.ZERO_HASH,
            codeHash: OP.ZERO_HASH
        },
          // callee2
        {
            address: '0xDCB77B866fE07451e8F89871EdB27b27aF9F2AFC',
            code: calleeCode2,
            tStorage: calleeTstorage2,
            nonce: new BN(0x1, 16),
            balance: new BN(0x64, 16),
            storageRoot: OP.ZERO_HASH,
            codeHash: OP.ZERO_HASH
        },
    ];
    
    const wrongCode = '608060405234801561001057600080fd5b50600436106100575760003560e01c80632e52d6061461005c5780635e01eb5a1461007a57806367e404ce146100c45780637174830f1461010e578063b2cd18b41461015c575b600080fd5b6100646101aa565b6040518082815260200191505060405180910390f35b6100826101b0565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6100cc6101da565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b61015a6004803603604081101561012457600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610200565b005b6101a86004803603604081101561017257600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061034e565b005b60005481565b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600060608373ffffffffffffffffffffffffffffffffffffffff1683604051602401808281526020019150506040516020818303038152906040527f3f7a0270000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040518082805190602001908083835b6020831015156102de57805182526020820191506020810190506020830392506102b9565b6001836020036101000a038019825116818451168082178552505050505050905001915050600060405180830381855af49150503d806000811461033e576040519150601f19603f3d011682016040523d82523d6000602084013e610343565b606091505b509150915050505050565b600060608373ffffffffffffffffffffffffffffffffffffffff1683604051602401808281526020019150506040516020818303038152906040527f3f7a0270000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040518082805190602001908083835b60208310151561042c5780518252602082019150602081019050602083039250610407565b6001836020036101000a0380198251168184511680821785525050505050509050019150506000604051808303816000865af19150503d806000811461048e576040519150601f19603f3d011682016040523d82523d6000602084013e610493565b606091505b50915091505050505056fea165627a7a72305820e5e115e20a05bd7786bf8103a4b83278f4af7afc4bb4a63bab92c9107669707c0029';
    const wrongFragmentTree = new FragmentTree().run(wrongCode);
    const wrongCodeHash = wrongFragmentTree.root.hash;
    
    const fragmentTree1 = new FragmentTree().run(calleeCode1);
    const fragmentTree2 = new FragmentTree().run(calleeCode2);

    const nonce = new BN(0x1, 16);
    const balance = new BN(0x64, 16);

    const calleeCodeHash1 = fragmentTree1.root.hash;
    const calleeCodeHash2 = fragmentTree2.root.hash;
    const storageRoot = '0xa7ff9e28ffd3def443d324547688c2c4eb98edf7da757d6bfa22bff55b9ce24a';

    let steps;
    let copy;
    let calleeCopy1;
    let calleeCopy2;
   
    let merkle;
   
    beforeEach(async () => {
      const runtime = new HydratedRuntime();
      steps = await runtime.run({ accounts, code, data, pc: 0, tStorage: tStorage });
      copy = _.cloneDeep(steps);
      // opcode CALL step 271, DELEGATECALL step 222
      calleeCopy1 = _.cloneDeep(steps[271].calleeSteps);
      calleeCopy2 = _.cloneDeep(steps[271].calleeSteps[222].calleeSteps);
   
           
      merkle = new Merkelizer().run(steps, code, data, tStorage);
    });

    it('solver has an wrong nonce proof in depth 1', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy1;

      const wrongNonce = new BN(0x2, 16);
      const wrongProof = [wrongNonce, balance, calleeCodeHash1, storageRoot];
      const rlpVal = utils.rlp.encode(wrongProof);
     
      wrongCalleeStep[0].bytecodeAccount.rlpVal = rlpVal;
      wrongExecution[271].calleeSteps = wrongCalleeStep;
      
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger has an wrong nonce proof in depth 1', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy1;
     
      const wrongNonce = new BN(0x2, 16);
      const wrongProof = [wrongNonce, balance, calleeCodeHash1, storageRoot];
      const rlpVal = utils.rlp.encode(wrongProof);

      wrongCalleeStep[0].bytecodeAccount.rlpVal = rlpVal;
      wrongExecution[271].calleeSteps = wrongCalleeStep;

      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver has an wrong balance proof in depth 1', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy1;

      const wrongBalance = new BN(0x100, 16);
      const wrongProof = [nonce, wrongBalance, calleeCodeHash1, storageRoot];
      const rlpVal = utils.rlp.encode(wrongProof);
     
      wrongCalleeStep[0].bytecodeAccount.rlpVal = rlpVal;
      wrongExecution[271].calleeSteps = wrongCalleeStep;
      
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger has an wrong balance proof in depth 1', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy1;
     
      const wrongBalance = new BN(0x100, 16);
      const wrongProof = [nonce, wrongBalance, calleeCodeHash1, storageRoot];
      const rlpVal = utils.rlp.encode(wrongProof);

      wrongCalleeStep[0].bytecodeAccount.rlpVal = rlpVal;
      wrongExecution[271].calleeSteps = wrongCalleeStep;

      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver has an wrong codeHash proof in depth 1', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy1;
      
      const wrongProof = ['', '', wrongCodeHash, storageRoot];
      const rlpVal = utils.rlp.encode(wrongProof);
     
      wrongCalleeStep[0].bytecodeAccount.rlpVal = rlpVal;
      wrongExecution[271].calleeSteps = wrongCalleeStep;
      
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger has an wrong codeHash proof in depth 1', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy1;
      
      const wrongProof = ['', '', wrongCodeHash, storageRoot];
      const rlpVal = utils.rlp.encode(wrongProof);

      wrongCalleeStep[0].bytecodeAccount.rlpVal = rlpVal;
      wrongExecution[271].calleeSteps = wrongCalleeStep;

      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver has an wrong storageRoot proof in depth 1', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy1;

      const wrongStorageRoot = Buffer.alloc(32);
      const wrongProof = [nonce, balance, calleeCodeHash1, wrongStorageRoot];
      const rlpVal = utils.rlp.encode(wrongProof);
     
      wrongCalleeStep[0].bytecodeAccount.rlpVal = rlpVal;
      wrongExecution[271].calleeSteps = wrongCalleeStep;
      
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger has an wrong storageRoot proof in depth 1', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy1;
     
      const wrongStorageRoot = Buffer.alloc(32);
      const wrongProof = [nonce, balance, calleeCodeHash1, wrongStorageRoot];
      const rlpVal = utils.rlp.encode(wrongProof);

      wrongCalleeStep[0].bytecodeAccount.rlpVal = rlpVal;
      wrongExecution[271].calleeSteps = wrongCalleeStep;

      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver has an wrong bytecodeAccount proof in depth 1', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy1;
      const wrongFragmentTree = new FragmentTree().run(wrongCode);
      const wrongCodeHash = wrongFragmentTree.root.hash;
      const wrongProof = ['', '', wrongCodeHash, storageRoot];
      const rlpVal = utils.rlp.encode(wrongProof);
     
      wrongCalleeStep[0].bytecodeAccount.rlpVal = rlpVal;
      wrongExecution[271].calleeSteps = wrongCalleeStep;
      
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger has an wrong bytecodeAccount proof in depth 1', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy1;
      const wrongFragmentTree = new FragmentTree().run(wrongCode);
      const wrongCodeHash = wrongFragmentTree.root.hash;
      const wrongProof = ['', '', wrongCodeHash, storageRoot];
      const rlpVal = utils.rlp.encode(wrongProof);

      wrongCalleeStep[0].bytecodeAccount.rlpVal = rlpVal;
      wrongExecution[271].calleeSteps = wrongCalleeStep;

      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver has an wrong code in depth 1', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy1;
      
      wrongCalleeStep[0].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
      wrongExecution[271].calleeSteps = wrongCalleeStep;
      
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      
      const wrongFragmentTree = new FragmentTree().run(wrongCode);
      const wrongCodeHash = wrongFragmentTree.root.hash;

      console.log('wrongCodeHash', wrongCodeHash);
      console.log('correctCodeHash', calleeCodeHash1)
      console.log('wrongCodeHash === correctCodeHash', wrongCodeHash === calleeCodeHash1)

      solverMerkle.tree[0][272].code = wrongCode;
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger has an wrong code in depth 1', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep = calleeCopy1;
      
      wrongCalleeStep[0].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
      wrongExecution[271].calleeSteps = wrongCalleeStep;
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
     
      const wrongFragmentTree = new FragmentTree().run(wrongCode);
      const wrongCodeHash = wrongFragmentTree.root.hash;

      console.log('wrongCodeHash', wrongCodeHash);
      console.log('correctCodeHash', calleeCodeHash1)
      console.log('wrongCodeHash === correctCodeHash', wrongCodeHash === calleeCodeHash1)

      challengerMerkle.tree[0][272].code = wrongCode;
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver has an wrong code in depth 2', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep1 = calleeCopy1;
      const wrongCalleeStep2 = calleeCopy2;
      
      wrongCalleeStep2[0].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
        
      wrongCalleeStep1[222].calleeSteps = wrongCalleeStep2;
      wrongExecution[271].calleeSteps = wrongCalleeStep1;
      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);

      const wrongFragmentTree = new FragmentTree().run(wrongCode);
      const wrongCodeHash = wrongFragmentTree.root.hash;
      
      console.log('wrongCodeHash', wrongCodeHash);
      console.log('correctCodeHash', calleeCodeHash2)
      console.log('wrongCodeHash === correctCodeHash', wrongCodeHash === calleeCodeHash2)

      solverMerkle.tree[0][495].code = wrongCode;
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger has an wrong code in depth 2', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep1 = calleeCopy1;
      const wrongCalleeStep2 = calleeCopy2;
      
      wrongCalleeStep2[0].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
        
      wrongCalleeStep1[222].calleeSteps = wrongCalleeStep2;
      wrongExecution[271].calleeSteps = wrongCalleeStep1;
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);

      const wrongFragmentTree = new FragmentTree().run(wrongCode);
      const wrongCodeHash = wrongFragmentTree.root.hash;

      console.log('wrongCodeHash', wrongCodeHash);
      console.log('correctCodeHash', calleeCodeHash2)
      console.log('wrongCodeHash === correctCodeHash', wrongCodeHash === calleeCodeHash2)
     
      challengerMerkle.tree[0][495].code = wrongCode;
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver has an output error somewhere in depth 2', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep1 = calleeCopy1;
      const wrongCalleeStep2 = calleeCopy2;

      wrongCalleeStep2[6].compactStack.push('0x0000000000000000000000000000000000000000000000000000000000000001');
      wrongCalleeStep2[6].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';

      wrongCalleeStep1[222].calleeSteps = wrongCalleeStep2;
      wrongExecution[271].calleeSteps = wrongCalleeStep1;

      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger has an output error somewhere in depth 2', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep1 = calleeCopy1;
      const wrongCalleeStep2 = calleeCopy2;

      wrongCalleeStep2[6].compactStack.push('0x0000000000000000000000000000000000000000000000000000000000000001');
      wrongCalleeStep2[6].stackHash = '0x0000000000000000000000000000000000000000000000000000000000000001';

      wrongCalleeStep1[222].calleeSteps = wrongCalleeStep2;
      wrongExecution[271].calleeSteps = wrongCalleeStep1;

      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver first step missing in depth 2', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep1 = calleeCopy1;
      const wrongCalleeStep2 = calleeCopy2;

      wrongCalleeStep2.shift();

      wrongCalleeStep1[222].calleeSteps = wrongCalleeStep2;
      wrongExecution[271].calleeSteps = wrongCalleeStep1;

      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger first step missing in depth 2', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep1 = calleeCopy1;
      const wrongCalleeStep2 = calleeCopy2;

      wrongCalleeStep2.shift();

      wrongCalleeStep1[222].calleeSteps = wrongCalleeStep2;
      wrongExecution[271].calleeSteps = wrongCalleeStep1;

      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });

    it('solver last step gone in depth 2', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep1 = calleeCopy1;
      const wrongCalleeStep2 = calleeCopy2;

      wrongCalleeStep2.pop();

      wrongCalleeStep1[222].calleeSteps = wrongCalleeStep2;
      wrongExecution[271].calleeSteps = wrongCalleeStep1;

      const solverMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, solverMerkle, merkle, 'challenger');
    });

    it('challenger last step gone in depth 2', async () => {
      const wrongExecution = copy;
      const wrongCalleeStep1 = calleeCopy1;
      const wrongCalleeStep2 = calleeCopy2;

      wrongCalleeStep2.pop();

      wrongCalleeStep1[222].calleeSteps = wrongCalleeStep2;
      wrongExecution[271].calleeSteps = wrongCalleeStep1;
           
      const challengerMerkle = new Merkelizer().run(wrongExecution, code, data, tStorage);
      await callback(code, data, tStorage, merkle, challengerMerkle, 'solver');
    });
   
  });
};
