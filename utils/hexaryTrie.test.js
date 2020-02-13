'use strict';

const HexaryTrie = require('./HexaryTrie');
const web3 = require('web3');
const utils = require('ethereumjs-util');
const assert = require('assert');
const ProvethVerifier = require('../build/contracts/ProvethVerifierTestHelper.json');
const { onchainWait, deployContract, deployCode, wallets, provider } = require('../test/helpers/utils');

describe('onchain merkle verify test', async () => {
    let ins;
    let proveth;
    beforeEach(async () => {
        ins = new HexaryTrie();
        proveth = await deployContract(ProvethVerifier);
    })
    
    it('merkle verify test', async () => {
        let key = 'test';
        let val = 'hello';
        
        const {rootHash, hashedKey, stack} = await ins.TestGetMerkleProof(key, val);
        let res = await proveth.exposedValidateMPTProof(
            rootHash,
            hashedKey,
            utils.rlp.encode(stack)
        )
        await onchainWait(10);
        const str = web3.utils.hexToAscii(res)
        assert.equal(val, str, 'it should equal offchain proof');
    })

    it('merkle verify test', async () => {
        let key = '0000000000000000000000000000000000000000000000000000000000000001';
        let val = '0f572e5295c57f15886f9b263e2f6d2d6c7b5ec6';
        
        const {rootHash, hashedKey, stack} = await ins.TestGetMerkleProof(key, val);
        let res = await proveth.exposedValidateMPTProof(
            rootHash,
            hashedKey,
            utils.rlp.encode(stack)
        )
        await onchainWait(10);
        const str = web3.utils.hexToAscii(res)
        assert.equal(val, str, 'it should equal offchain proof');
    })
});

