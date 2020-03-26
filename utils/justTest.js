const ethers = require('ethers');

const h = ethers.utils.solidityKeccak256(
    ['bytes[]'],
    [['0x00000000000000000000000000000000000000000000000000000000ee919d50']]
  );

console.log(h);
