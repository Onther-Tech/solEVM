const Verifier = require('./../build/contracts/VerifierStorage.json');
console.log('Verifier Bytecode Length', (Verifier.deployedBytecode.length / 2).toString(16));
const Enforcer = require('./../build/contracts/EnforcerStorage.json');
console.log('Enforcer Bytecode Length', Enforcer.deployedBytecode.length.toString(16));