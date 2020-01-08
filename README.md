# CP challenge for Tokamak

## Implementation Status

- [x]  support storage field on contract
- [x]  support storage field to local VM
- [x]  support OPcode SSTORE, SLOAD 
- [x]  support storage 필드 in merkle tree offchain
- [x]  support external call(verification of a contract code in offchain) 
- [x]  verification of ERC-20 contract method(balanceOf, transfer)
- [x]  support log field in execution state
- [ ]  implementation of merkle tree for storage(when it needs to be submit offchain)
- [ ]  support OPcode CALL 
- [ ]  support OPcode DELEGATECALL 
- [ ]  implementation of compact storage 
- [ ]  implementation of compact return data 
- [ ]  implementation of compact log
- [ ]  support OPcode(BALANCE, LOG, GASLIMIT, EXTCODESIZE, EXTCODECOPY, EXTCODEHASH, RETURNDATASIZE)
- [ ]  integration with Plasma EVM client(GO porting)

## Setup

```bash
$ git clone https://github.com/Onther-Tech/solEVM.git ./
$ git checkout 72b536a183e70ab0452b17761975951d9cc46e0f
$ npm install
```

## Test
You can run all the tests like this:
```bash
$ yarn
$ yarn test
```

You can run the test of ERC20 token transfer :
```bash
$ ./scripts/test_geth.sh test/contracts/disputeERC20.js
```

You can run the test of offchain stepper(Offchain VM) :
```bash
$ node test/utils/testStepper.js
```

You can compile all contracts :
```bash
$ npm run compile:contracts
```
