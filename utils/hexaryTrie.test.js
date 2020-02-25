'use strict';

const OP = require('./constants');
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
        const {res, value} = await proveth.exposedValidateMPTProof(
            rootHash,
            hashedKey,
            utils.rlp.encode(stack)
        )
        await onchainWait(10);
        const success = res;
        const str = web3.utils.hexToAscii(value);
        assert.equal(success, 1, 'it should return 1 if success')
        assert.equal(val, str, 'it should equal offchain proof');
    })

    it('merkle verify test', async () => {
        let key = '0000000000000000000000000000000000000000000000000000000000000001';
        let val = '0f572e5295c57f15886f9b263e2f6d2d6c7b5ec6';
        
        const {rootHash, hashedKey, stack} = await ins.TestGetMerkleProof(key, val);
        const {res, value}= await proveth.exposedValidateMPTProof(
            rootHash,
            hashedKey,
            utils.rlp.encode(stack)
        )
        await onchainWait(10);
        const success = res;
        const str = web3.utils.hexToAscii(value);
        assert.equal(success, 1, 'it should return 1 if success')
        assert.equal(val, str, 'it should equal offchain proof');
    })

    it('merkle verify test', async () => {
        let key = '0000000000000000000000000000000000000000000000000000000000000001';
        let val = '0f572e5295c57f15886f9b263e2f6d2d6c7b5ec6';
        
        const {rootHash, hashedKey, stack} = await ins.TestGetMerkleProof(key, val);
        console.log('rootHash', rootHash);
        console.log('temp', Buffer.from(web3.utils.hexToBytes('0xa618acf72689001eade86205e389cf1918de4cd4594bb7a673612c17553a43f8')))
        const {res, value}= await proveth.exposedValidateMPTProof(
            web3.utils.hexToBytes('0xa618acf72689001eade86205e389cf1918de4cd4594bb7a673612c17553a43f8'),
            hashedKey,
            utils.rlp.encode(stack)
        )
        await onchainWait(10);
        const fail = res;
        const str = value;
        assert.equal(fail, 0, 'it should return 0 if failed')
        assert.equal(str, 0, 'it should equal 0');
    })
});

