# CP challenge for Tokamak
[![Discord](https://img.shields.io/badge/discord-join%20chat-blue.svg)](https://discord.gg/8wSpJKz)

## Implementation Status

### Support Storage
- [x]  support storage field on contract
- [x]  support storage field to local VM
- [x]  support OPcode SSTORE, SLOAD 
- [x]  support storage 필드 in merkle tree offchain

### Verification of external code in offchain
- [x]  support external call(verification of a contract code in offchain) 

### Verification of ERC20 token method
- [x]  support log field in execution state
- [x]  verification of ERC-20 contract method(balanceOf)
- [x]  verification of ERC-20 contract method(transfer)

### Support Stateful
- [ ]  support Account
- [ ]  support ETH transfer


### Support CALL like OPCODES
- [x]  implementation of arranging execution steps of CALLER and CALLEE
- [ ]  implementation of submitting merkle proof for state
- [ ]  support OPcode CALL 
- [ ]  support OPcode DELEGATECALL 
- [ ]  support OPcode STATICCALL 

### Support State Transition Function  
- [ ]  support charging UPFRONT COST
- [ ]  support refunding TX FEE
- [ ]  support block's reward in case of last transaction 

### Optimization
- [ ]  implementation of compact storage 
- [ ]  implementation of compact return data 
- [ ]  implementation of compact log

### Integration with Clients
- [ ]  integration with Plasma EVM client(GO porting)

### Misc
- [ ]  support OPcode(BALANCE, GASLIMIT, EXTCODESIZE, EXTCODECOPY, EXTCODEHASH, RETURNDATASIZE)

## Setup

```bash
$ git clone https://github.com/Onther-Tech/solEVM.git ./
$ npm install
```

## Test
You can run the tests of verification game :
```bash
$ ./scripts/test_geth.sh test/contracts/[Test File].js
```
If you want to look into more details or debug for development you can do like this :
```bash
$ DEBUG=vgame-test ./scripts/test_geth.sh test/contracts/[Test File].js
```

You can run the test of offchain stepper(Offchain VM) :
```bash
$ node test/utils/testStepper.js
```

You can run the test of offchain stepper when to execute CALL(Offchain VM) :
```bash
$ npm run test:utils:call
```

You can compile all contracts :
```bash
$ npm run compile:contracts
```

## Usage
```javascript
describe('Fixture for Dispute/Verifier Logic #1', function () {    
    
    const code = ['runtime bytecode'];
    const data = ['callData'];
    const tStorage = ['0x + hex'];
    
    let steps;
    let copy;
    let merkle;
    const runtime = new HydratedRuntime();

    beforeEach(async () => {
      steps = await runtime.run({ code, data, pc: 0, tStorage: tStorage });
      copy = JSON.stringify(steps);
      merkle = new Merkelizer().run(steps, code, data, tStorage);
    });
```

### Input 
- code [runtime bytecode] - bytes
- data [callData] - bytes
- stack [hex number] - 32bytes
- mem [hex number] - 32bytes
- tStorage [slot, value, slot, value, ...] - 32bytes


## Test Status
Test Files | Case | Pass / Fail / Not Yet
|:---:|---|---| 
|dispute.storage.js | `OPCODE SLOAD, SSTORE Support` | Pass
|dispute.log.js | `OPCODE LOG Support` | Pass
|dispute.balanceOf.js | `ERC20 balanceOf Verification` | Pass
|dispute.transfer.js | `ERC20 transfer Verification` | Pass
|-| `OPCODE CALL, DELEGATECALL, STATICCALL Support` | Not Yet
|-| `OPCODE CREATE, CREATE2 Support` | Not Yet

### Test Case
Case | 
--- |
`both have the same result, solver wins` 
`challenger has an output error somewhere` 
`solver has an output error somewhere` 
`challenger first step missing` 
`solver first step missing` 
`challenger last step gone` 
`solver last step gone` 
`challenger wrong memory output` 
`solver wrong memory output` 
`challenger wrong stack output` 
`solver wrong stack output` 
`challenger wrong opcode` 
`solver wrong opcode` 
`only two steps, both wrong but doesn\'t end with OP.REVERT or RETURN = challenger wins` 
`solver misses steps in between` 
`solver with one invalid step` 
`challenger with one invalid step` 
`solver with one invalid step against LOG` 
`challenger with one invalid step against LOG` 

















