'use strict';

const Trie = require('merkle-patricia-tree/secure');
const TrieNode = require('merkle-patricia-tree/trieNode');
const stringToNibbles = TrieNode.stringToNibbles;

const level = require('level-mem');
const utils = require('ethereumjs-util');

module.exports = class HexaryTrie {
    constructor () {
        this.db = level();
        this.Trie = Trie;
        this.trie = new Trie(this.db)
    }

    async putData (key, val) {
        return new Promise((resolve, reject) => {
            const cb = function (err, result) {
                if (err) {
                    reject(err)
                    return;
                }
                resolve();
           
            };
        
            this.trie.put(key, val, cb);

            return;
                
        });
    };

    async getData (key) {
        return new Promise((resolve, reject) => {
            const cb = function (err, result) {
                if (err) {
                    reject(err)
                    return;
                }
                if (result !== null){
                    result = result.toString();
                    resolve(result);
                } else {
                    resolve(0);
                }
           
            };
        
            this.trie.get(key, cb);

            return;
                
        });
    };

    async verifyProof (rootHash, hashedKey, prove) {
        return new Promise((resolve, reject) => {
            const cb = function (err, result) {
                if (err) {
                    reject(err)
                    return;
                }
                result = result.toString();
                resolve(result);
            };
        
            this.Trie.verifyProof(rootHash, hashedKey, prove, cb);

            return;
                
        });
    };

    async TestGetProof (trie, key) {
        return new Promise((resolve, reject) => {
            const cb = function (err, result) {
                if (err) {
                    reject(err)
                    return;
                }
                let stack = [];
                for (let i = 0; i < result.length; i++) {
                    let val = utils.rlp.decode(result[i]);
                    // let val = result[i].toString('hex')
                    stack.push(val)
                }
                resolve({result, stack});
            };
        
            this.Trie.prove(trie, key, cb);

            return;
                
        });
    };

    async TestGetMerkleProof (key, val) {
        try {
            await this.trie.put(key, val, () => {});
            
            const data = await this.getData(key);
            console.log('data',data)
            let hashedKey = utils.keccak(key);
            let rootHash = this.trie.root;

            const res = await this.TestGetProof(this.trie, hashedKey);
            const prove = res.result;
            const stack = res.stack;
            await this.verifyProof(rootHash, hashedKey, prove);

            hashedKey = stringToNibbles(hashedKey);
            
            return {rootHash, hashedKey, stack};
                    
        } catch (error) {
            console.log(error)
        }
    };

    async getProof (key) {
        
        let rootHash = this.trie.root;
        let hashedKey = utils.keccak(key);
        
        return new Promise((resolve, reject) => {
            const cb = function (err, result) {
                if (err) {
                    reject(err)
                    return;
                }
                let stack = [];
                for (let i = 0; i < result.length; i++) {
                    let val = utils.rlp.decode(result[i]);
                    stack.push(val)
                }
                hashedKey = stringToNibbles(hashedKey);
                resolve({rootHash, hashedKey, stack});
            };
        
            this.Trie.prove(this.trie, hashedKey, cb);

            return;
                
        });
    };
};