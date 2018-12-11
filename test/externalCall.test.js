import Runtime from './helpers/runtimeAdapter';
import { encodeAccounts } from './utils';

const EthereumRuntime = artifacts.require('EthereumRuntime.sol');

contract('Runtime', function () {
  let rt;

  before(async () => {
    rt = new Runtime(await EthereumRuntime.new());
  });

  describe('execute CALL opcode', () => {
    let accountA, accountACode
    let accountB, accountBCode;

    it('deploy A contract', async () => {
      const code = '0x6080604052600160005534801561001557600080fd5b5060dc806100246000396000f3006080604052600436106049576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680632e52d60614604e5780633f7a0270146076575b600080fd5b348015605957600080fd5b50606060a0565b6040518082815260200191505060405180910390f35b348015608157600080fd5b50609e6004803603810190808035906020019092919050505060a6565b005b60005481565b80600081905550505600a165627a7a72305820c45ffa7ae9484b1e04f5cecb0402fe3ff9da7f1f1ddca18b5186bf1557693b770029';
      const calldata = '0x6080604052600160005534801561001557600080fd5b5060dc806100246000396000f3006080604052600436106049576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680632e52d60614604e5780633f7a0270146076575b600080fd5b348015605957600080fd5b50606060a0565b6040518082815260200191505060405180910390f35b348015608157600080fd5b50609e6004803603810190808035906020019092919050505060a6565b005b60005481565b80600081905550505600a165627a7a72305820c45ffa7ae9484b1e04f5cecb0402fe3ff9da7f1f1ddca18b5186bf1557693b770029';
      const pc = 0;
      const pcEnd = 0;
      const blockGasLimit = 0xfffffffffffff;
      const gasLimit = 0xfffffffffffff;

      const res = await rt.executeAndStop(
        code, calldata,
        [pc, pcEnd, blockGasLimit, gasLimit]
      );

      const memoryRes = [];
      res.memory = res.memory.slice(2, res.memory.length);
      for (let i = 0, k = 0; i < res.memory.length; i += 32, k += 16) {
        memoryRes.push(`0x${k.toString(16)}: 0x${res.memory.slice(i, i + 32)}`);
      }

      console.log('instruction: ' + res.pc);
      console.log('      stack: ' + res.stack.reverse().map(stack => `\n\t${stack.toString(16)}`));
      console.log('     memory: ' + memoryRes.map(memory => `\n\t${memory}`));
      console.log('   accounts: ' + res.accounts.map(account => `\n\t${account.toString(16)}`));

      accountA = res.accounts;
      accountACode = res.accountsCode;
    });
    
    it('deploy B contract', async () => {
      const code = '0x608060405234801561001057600080fd5b5060405160208061025483398101806040528101908080519060200190929190505050806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550506101d1806100836000396000f30060806040526004361061004c576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680630dbe671f146100515780633f7a0270146100a8575b600080fd5b34801561005d57600080fd5b506100666100d5565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b3480156100b457600080fd5b506100d3600480360381019080803590602001909291905050506100fa565b005b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16633f7a0270826040518263ffffffff167c010000000000000000000000000000000000000000000000000000000002815260040180828152602001915050600060405180830381600087803b15801561018a57600080fd5b505af115801561019e573d6000803e3d6000fd5b50505050505600a165627a7a723058203a621dde3c8299c31891cb96ae5eb2116c26dcf130f4c29a8b88419fac8aacaa0029000000000000000000000000692a70d2e424a56d2c6c27aa97d1a86395877b3a';
      const calldata = '0x608060405234801561001057600080fd5b5060405160208061025483398101806040528101908080519060200190929190505050806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550506101d1806100836000396000f30060806040526004361061004c576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680630dbe671f146100515780633f7a0270146100a8575b600080fd5b34801561005d57600080fd5b506100666100d5565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b3480156100b457600080fd5b506100d3600480360381019080803590602001909291905050506100fa565b005b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16633f7a0270826040518263ffffffff167c010000000000000000000000000000000000000000000000000000000002815260040180828152602001915050600060405180830381600087803b15801561018a57600080fd5b505af115801561019e573d6000803e3d6000fd5b50505050505600a165627a7a723058203a621dde3c8299c31891cb96ae5eb2116c26dcf130f4c29a8b88419fac8aacaa0029000000000000000000000000692a70d2e424a56d2c6c27aa97d1a86395877b3a';
      const pc = 0;
      const pcEnd = 0;
      const blockGasLimit = 0xfffffffffffff;
      const gasLimit = 0xfffffffffffff;

      const res = await rt.executeAndStop(
        code, calldata,
        [pc, pcEnd, blockGasLimit, gasLimit]
      );

      const memoryRes = [];
      res.memory = res.memory.slice(2, res.memory.length);
      for (let i = 0, k = 0; i < res.memory.length; i += 32, k += 16) {
        memoryRes.push(`0x${k.toString(16)}: 0x${res.memory.slice(i, i + 32)}`);
      }

      console.log('instruction: ' + res.pc);
      console.log('      stack: ' + res.stack.reverse().map(stack => `\n\t${stack.toString(16)}`));
      console.log('     memory: ' + memoryRes.map(memory => `\n\t${memory}`));
      console.log('   accounts: ' + res.accounts.map(account => `\n\t${account.toString(16)}`));

      accountB = res.accounts;
      accountBCode = res.accountsCode;
    });

    it('setN', async () => {
      const code = '0x60806040526004361061004c576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680630dbe671f146100515780633f7a0270146100a8575b600080fd5b34801561005d57600080fd5b506100666100d5565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b3480156100b457600080fd5b506100d3600480360381019080803590602001909291905050506100fa565b005b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16633f7a0270826040518263ffffffff167c010000000000000000000000000000000000000000000000000000000002815260040180828152602001915050600060405180830381600087803b15801561018a57600080fd5b505af115801561019e573d6000803e3d6000fd5b50505050505600a165627a7a723058203a621dde3c8299c31891cb96ae5eb2116c26dcf130f4c29a8b88419fac8aacaa0029';
      const calldata = '0x3f7a0270000000000000000000000000000000000000000000000000000000000000000a';
      const pc = 0;
      const pcEnd = 0;
      const blockGasLimit = 0xfffffffffffff;
      const gasLimit = 0xfffffffffffff;

      const res = await rt.initAndExecute(
        code, calldata,
        [pc, pcEnd, blockGasLimit, gasLimit],
        [], '0x', accountA.concat(accountB), accountACode.concat(accountBCode.substr(2, accountBCode.length)), [], '0x'
      );
      const memoryRes = [];
      res.memory = res.memory.slice(2, res.memory.length);
      for (let i = 0, k = 0; i < res.memory.length; i += 32, k += 16) {
        memoryRes.push(`0x${k.toString(16)}: 0x${res.memory.slice(i, i + 32)}`);
      }

      console.log('instruction: ' + res.pc);
      console.log('      stack: ' + res.stack.reverse().map(stack => `\n\t${stack.toString(16)}`));
      console.log('     memory: ' + memoryRes.map(memory => `\n\t${memory}`));
      console.log('   accounts: ' + res.accounts.map(account => `\n\t${account.toString(16)}`));
    });
  });
});
