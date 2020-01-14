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
- [ ]  support ETH transfer
- [ ]  support OPcode(BALANCE, LOG, GASLIMIT, EXTCODESIZE, EXTCODECOPY, EXTCODEHASH, RETURNDATASIZE)
- [ ]  support OPcode CALL 
- [ ]  support OPcode DELEGATECALL 
- [ ]  include account to EVM parameter 
- [ ]  implementation of compact storage 
- [ ]  implementation of compact return data 
- [ ]  implementation of compact log
- [ ]  integration with Plasma EVM client(GO porting)

## Setup

```bash
$ git clone https://github.com/Onther-Tech/solEVM.git ./
$ git checkout 72b536a183e70ab0452b17761975951d9cc46e0f
$ npm install
```

## Test
You can run the tests of verification game :
```bash
$ ./scripts/test_geth.sh test/contracts/[Test File].js
```

You can run the test of offchain stepper(Offchain VM) :
```bash
$ node test/utils/testStepper.js
```

You can compile all contracts :
```bash
$ npm run compile:contracts
```

## Usage
```javascript
describe('Fixture for Dispute/Verifier Logic #1', function () {    
    
    const code = '[runtime bytecode]';
    const data = '[callData]';
    const stack = [
      '0x0000000000000000000000000000000000000000000000000000000070a08231',
      '0x0000000000000000000000000000000000000000000000000000000000000263',
      '0x000000000000000000000000ca35b7d915458ef540ade6068dfe2f44e8fa733c'
    ];
    const mem = [
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000000000000000000000000080'
    ];
    const tStorage = [
      '0xaf63dba574b8df870564c0cfef95996d0bf09a9de28de1e31994eb090e8e7737',
      '0x00000000000000000000000000000000000000000000000000000000000003e8',
      '0x0000000000000000000000000000000000000000000000000000000000000002',
      '0x00000000000000000000000000000000000000000000000000000000000003e8'
    ];
    
    let steps;
    let copy;
    let merkle;
    const runtime = new HydratedRuntime();

    beforeEach(async () => {
      steps = await runtime.run({ code, data, pc: 0, tStorage: tStorage, stepCount: 355 });
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
Test Files | Case | Pass / Fail 
|:---:|---|---| 
|dispute.storage.js | `OPCODE SLOAD, SSTORE Support` | Pass
|dispute.log.js | `OPCODE LOG Support` | Pass
|dispute.balanceOf.js | `ERC20 balanceOf Verification` | Pass
|dispute.transfer.js | `ERC20 transfer Verification` | Pass
|-| `External Bytecode Support` | Pass
|-| `OPCODE CALL, DELEGATECALL, STATICCALL Support` | Fail
|-| `OPCODE CREATE, CREATE2 Support` | Fail

### Detail
Case | Pass / Fail 
--- | --- 
`both have the same result, solver wins` | Pass
`challenger has an output error somewhere` | Pass
`solver has an output error somewhere` | Pass
`challenger first step missing` | Pass
`solver first step missing` | Pass
`challenger last step gone` | Pass
`solver last step gone` | Pass
`challenger wrong memory output` | Pass
`solver wrong memory output` | Pass
`challenger wrong stack output` | Pass
`solver wrong stack output` | Pass
`challenger wrong opcode` | Pass
`solver wrong opcode` | Pass
`only two steps, both wrong but doesn\'t end with OP.REVERT or RETURN = challenger wins` | Pass
`solver misses steps in between` | Pass
`solver with one invalid step` | Pass
`challenger with one invalid step` | Pass
`solver with one invalid step against LOG` | Pass
`challenger with one invalid step against LOG` | Pass

















