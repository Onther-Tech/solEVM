pragma solidity ^0.5.0;

import {EVMStorageToArray} from "./EVMStorageToArray.slb";

contract EVMStorageTest2 {

    using EVMStorageToArray for EVMStorageToArray.Storage;
    using EVMStorageToArray for EVMStorageToArray.Element;

    function testToArray() public payable returns (bool ret) {
        ret = true;
        EVMStorageToArray.Storage memory sge;
        sge.store(0x01, 0x02);
        sge.store(0x03, 0x00);
        sge.store(0x05, 0x06);

        bytes32[] memory sgeArr = sge.toArrayForHash();
        assert(sgeArr.length == 3);
        assert(sgeArr[0] == byte(0x01));
        assert(sgeArr[1] == byte(0x02));
        assert(sgeArr[2] == byte(0x03));
        assert(sgeArr[3] == byte(0x00));
        assert(sgeArr[4] == byte(0x05));
        assert(sgeArr[5] == byte(0x06));
    }

}
