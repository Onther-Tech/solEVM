pragma solidity ^0.5.0;

import {EVMStorageToArray} from "./EVMStorageToArray.slb";

contract EVMStorageTest {

    using EVMStorageToArray for EVMStorageToArray.Storage;
    using EVMStorageToArray for EVMStorageToArray.Element;
    
    function testToArrayForHash() public payable returns (bool ret) {
        ret = true;
        EVMStorageToArray.Storage memory sge;
        sge.store(0x01, 0x02);
        sge.store(0x03, 0x00);
        sge.store(0x05, 0x06);
        
        bytes32[] memory sgeArr = sge.toArrayForHash();
        
        assert(sgeArr.length == 6);
        assert(sgeArr[0] == bytes32(uint(0x01)));
        assert(sgeArr[1] == bytes32(uint(0x02)));
        assert(sgeArr[2] == bytes32(uint(0x03)));
        assert(sgeArr[3] == bytes32(uint(0x00)));
        assert(sgeArr[4] == bytes32(uint(0x05)));
        assert(sgeArr[5] == bytes32(uint(0x06)));
    }
}
