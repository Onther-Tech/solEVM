'use strict';

const HydratedRuntime = require('./../../utils/HydratedRuntime');
const Merkelizer = require('../../utils/Merkelizer');
const OP = require('../../utils/constants');
const debug = require('debug')('dispute-test');

const account = {
  nonce : 1,
  balance : 1e19,
  bytecode : '608060405260043610610057576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680632e52d6061461005c5780633f7a02701461008757806367e404ce146100b4575b600080fd5b34801561006857600080fd5b5061007161010b565b6040518082815260200191505060405180910390f35b34801561009357600080fd5b506100b260048036038101908080359060200190929190505050610111565b005b3480156100c057600080fd5b506100c961015c565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b60005481565b8060008190555033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16815600a165627a7a723058204b7b0db89721e0df40000cbbee53096408cada5be2c4c4a3246df72975d151750029',
  storage : []
}
let code = '6080604052600436106100505760003560e01c63ffffffff168063141f32ff146100555780632e52d606146100a257806367e404ce146100cd5780639b58bc2614610124578063eea4c86414610171575b600080fd5b34801561006157600080fd5b506100a0600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506101be565b005b3480156100ae57600080fd5b506100b7610242565b6040518082815260200191505060405180910390f35b3480156100d957600080fd5b506100e2610248565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b34801561013057600080fd5b5061016f600480360381019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061026e565b005b34801561017d57600080fd5b506101bc600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506102f0565b005b8173ffffffffffffffffffffffffffffffffffffffff1660405180807f7365744e2875696e743235362900000000000000000000000000000000000000815250600d019050604051809103902060e01c826040518263ffffffff1660e01b8152600401808281526020019150506000604051808303816000875af292505050505050565b60005481565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b8173ffffffffffffffffffffffffffffffffffffffff1660405180807f7365744e2875696e743235362900000000000000000000000000000000000000815250600d019050604051809103902060e01c826040518263ffffffff1660e01b815260040180828152602001915050600060405180830381865af492505050505050565b8173ffffffffffffffffffffffffffffffffffffffff1660405180807f7365744e2875696e743235362900000000000000000000000000000000000000815250600d019050604051809103902060e01c826040518263ffffffff1660e01b8152600401808281526020019150506000604051808303816000875af1925050505050505600a165627a7a72305820ef6419e53bb5b6911db1b3e53234cb7ec9e96849b62583cdcb667d933794ea860029';
const data = '0xeea4c864000000000000000000000000bbf289d846208c16edc8474705c748aff07732db000000000000000000000000000000000000000000000000000000000000000a';
// const stack = [
//   '0x0000000000000000000000000000000000000000000000000000000000000000',
//   '0x0000000000000000000000000000000000000000000000000000000000000080',
//   '0x0000000000000000000000000000000000000000000000000000000000000024',
//   '0x0000000000000000000000000000000000000000000000000000000000000080',
//   '0x0000000000000000000000000000000000000000000000000000000000000000',
//   '0x000000000000000000000000bbf289d846208c16edc8474705c748aff07732db',
//   '0x000000000000000000000000000000000000000000000000000ffffffffffe0d' 
// ];
// const mem = [
//   '0x0000000000000000000000000000000000000000000000000000000000000000',
//   '0x0000000000000000000000000000000000000000000000000000000000000000',
//   '0x0000000000000000000000000000000000000000000000000000000000000080',
//   '0x0000000000000000000000000000000000000000000000000000000000000000',
//   '0x3f7a027000000000000000000000000000000000000000000000000000000000',
//   '0x0000000a00000000000000000000000000000000000000000000000000000000'
// ];
// const tStorage = [
//   '0xaf63dba574b8df870564c0cfef95996d0bf09a9de28de1e31994eb090e8e7737',
//   '0x00000000000000000000000000000000000000000000000000000000000003e8',
//   '0x0000000000000000000000000000000000000000000000000000000000000002',
//   '0x00000000000000000000000000000000000000000000000000000000000003e8'
// ];

// need to init tStorage
const tStorage = []; 

let steps;
let copy;
let merkle;
const runtime = new HydratedRuntime();

(async function(){
    steps = await runtime.run({ account, code, data, tStorage: tStorage });
    console.log(steps[0].calleeSteps);
    //console.log(steps, steps.length);
       
    merkle = await new Merkelizer().run(steps, code, data, tStorage);
    console.log(merkle.printLeave());
})();