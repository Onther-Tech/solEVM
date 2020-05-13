const createKeccakHash = require('keccak');
const { ZERO_HASH } = require('./constants');
const web3 = require('web3');

function stackHashes (stack, sibling) {
    // could be further improved by a custom keccak implementation
    const hash = createKeccakHash('keccak256');

    let res;
    let hashes;
    if (!sibling) {
        res = stack;
        hashes = [];
    } else {
        res = sibling || ZERO_HASH;
        hashes = [res];
    }
    
    hash.update(Buffer.from(res.replace('0x', ''), 'hex'));
    let val;
    if (sibling) {
        val = Buffer.from(stack.replace('0x', ''), 'hex');
        hash.update(val);
    }
   
    const buf = hash.digest();
    hashes.push(`0x${buf.toString('hex')}`);
    hash._finalized = false;
    hash.update(buf);
    
    // hashes.push(`0x${hash.digest().toString('hex')}`);
    return hashes;
  }

  function stackHash (stack, sibling) {
    const res = stackHashes(stack, sibling);
    // console.log(res);
    return res[res.length - 1];
  }
  const addr = '0x5C3c1540Dfcd795B0aca58A496e3c30FE2405B07';

  const addr2 = '0xe3632B9aB0571d2601e804DfDDc65EB51AB19310'

  const addr3 = '0xDCB77B866fE07451e8F89871EdB27b27aF9F2AFC';

  const hash = stackHash(addr);
  console.log('1', hash);
  
  const hash2 = stackHash(addr2, hash);
  console.log('2', hash2)

  const hash3 = stackHash(addr3, hash2);
  console.log('3', hash3)

  const h = web3.utils.soliditySha3('0x5C3c1540Dfcd795B0aca58A496e3c30FE2405B07');
  console.log(h);
  

  