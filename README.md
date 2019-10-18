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

