const utils = require('ethereumjs-util');
const web3 = require('web3');

const SMT = require('./smt/SparseMerkleTrie').SMT;
const smt = new SMT();

const k1 = Buffer.from('af63dba574b8df870564c0cfef95996d0bf09a9de28de1e31994eb090e8e7737', 'hex');
const v1 = Buffer.from('00000000000000000000000000000000000000000000000000000000000003e8', 'hex');
const k2 = Buffer.from('0000000000000000000000000000000000000000000000000000000000000002', 'hex');
const v2 = Buffer.from('00000000000000000000000000000000000000000000000000000000000003e8', 'hex');
const k3 = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
const v3 = Buffer.from('0000000000000000000000000000000000000000000000000000000000000fff', 'hex');


const hashedK1 = smt.hash(k1);
const hashedK2 = smt.hash(k2);
const hashedK3 = smt.hash(k3);

smt.putData(hashedK1,v1);
smt.putData(hashedK2,v2);
smt.putData(hashedK3,v3);

const root = smt.root;
console.log(root.toString('hex'));







