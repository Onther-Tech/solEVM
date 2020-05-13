const ethers = require('ethers');

function addressHash (currentAddr, compactAddressHash) {
    let hashes = [];
    if (!compactAddressHash) {
        const res = ethers.utils.solidityKeccak256(
            ['address'],
            [currentAddr]
        );
        hashes.push(res);
    } else {
        const hash = ethers.utils.solidityKeccak256(
            ['address'],
            [currentAddr]
        );
        const res = ethers.utils.solidityKeccak256(
            ['bytes32', 'bytes32'],
            [hash, compactAddressHash]
        );
    }
    return hashes;
  }

  function accountHash (runtimeAccount) {
      return ethers.utils.solidityKeccak256(
        ['address', 'bytes'],
        [runtimeAccount.addr, runtimeAccount.rlpVal]
      );
    }
  

  const addr = '0x5C3c1540Dfcd795B0aca58A496e3c30FE2405B07';

  const addr2 = '0xe3632B9aB0571d2601e804DfDDc65EB51AB19310'

  const addr3 = '0xDCB77B866fE07451e8F89871EdB27b27aF9F2AFC';

  const hash = addressHash(addr);
  console.log('1', hash);
  
  const hash2 = addressHash(addr2, hash);
  console.log('2', hash2)

  const hash3 = addressHash(addr3, hash2);
  console.log('3', hash3)

  const h = ethers.utils.solidityKeccak256(
    ['address'],
    ['0x5C3c1540Dfcd795B0aca58A496e3c30FE2405B07']
);
  console.log(h);
  

  