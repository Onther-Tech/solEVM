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

    function testFromArrayForHash() public payable returns (bool ret) {
        ret = true;
        bytes32[] memory storageIn = new bytes32[](8);
        storageIn[0] = bytes32(uint(0x01));
        storageIn[1] = bytes32(uint(0x02));
        storageIn[2] = bytes32(uint(0x03));
        storageIn[3] = bytes32(uint(0x04));
        storageIn[4] = bytes32(uint(0x05));
        storageIn[5] = bytes32(uint(0x06));
        storageIn[6] = bytes32(uint(0x07));
        storageIn[7] = bytes32(uint(0x08));
        
        EVMStorageToArray.Storage memory sge;
        sge = EVMStorageToArray.fromArrayForHash(storageIn);
        assert(sge.load(0x01) == 0x02);
        assert(sge.load(0x03) == 0x04);
        assert(sge.load(0x05) == 0x06);
        assert(sge.load(0x07) == 0x08);
                
    }

    function testStoreEmpty() public payable returns (bool ret) {
        ret = true;
        EVMStorageToArray.Storage memory sge;
        sge.store(0x01, 0x02);
        assert(sge.size == 1);
        assert(sge.head._next == 0);
        assert(sge.head.slot.addr == 0x01);
        assert(sge.head.slot.val == 0x02);
    }

    function testStoreTwo() public payable returns (bool ret) {
        ret = true;
        EVMStorageToArray.Storage memory sge;
        sge.store(0x01, 0x02);
        sge.store(0x03, 0x04);
        assert(sge.size == 2);

        EVMStorageToArray.Element memory e = sge.head;
        assert(e._next != 0);
        assert(e.slot.addr == 0x01);
        assert(e.slot.val == 0x02);

        uint n = e._next;
        assembly {
            e := n
        }
        assert(e._next == 0);

        assert(e.slot.addr == 0x03);
        assert(e.slot.val == 0x04);

    }

    function testOverwrite() public payable returns (bool ret) {
        ret = true;
        EVMStorageToArray.Storage memory sge;
        sge.store(0x01, 0x02);
        sge.store(0x01, 0x03);
        assert(sge.size == 1);
        assert(sge.head._next == 0);
        assert(sge.head.slot.addr == 0x01);
        assert(sge.head.slot.val == 0x03);
    }

    function testLoad() public payable returns (bool ret) {
        ret = true;
        EVMStorageToArray.Storage memory sge;
        sge.store(0x01, 0x02);
        sge.store(0x03, 0x04);

        assert(sge.load(0x01) == 0x02);
        assert(sge.load(0x03) == 0x04);
        assert(sge.load(0x1234) == 0);
    }

    function testCopy() public payable returns (bool ret) {
        ret = true;
        EVMStorageToArray.Storage memory sge;
        sge.store(0x01, 0x02);
        sge.store(0x03, 0x04);
        sge.store(0x05, 0x06);

        EVMStorageToArray.Storage memory cpy = sge.copy();

        assert(cpy.size == 3);
        assert(cpy.load(0x01) == 0x02);
        assert(cpy.load(0x03) == 0x04);
        assert(cpy.load(0x05) == 0x06);
    }

    function testToArray() public payable returns (bool ret) {
        ret = true;
        EVMStorageToArray.Storage memory sge;
        sge.store(0x01, 0x02);
        sge.store(0x03, 0x00);
        sge.store(0x05, 0x06);

        EVMStorageToArray.StorageSlot[] memory sgeArr = sge.toArray();
        assert(sgeArr.length == 3);
        assert(sgeArr[0].addr == 0x01);
        assert(sgeArr[0].val == 0x02);
        assert(sgeArr[1].addr == 0x03);
        assert(sgeArr[1].val == 0x00);
        assert(sgeArr[2].addr == 0x05);
        assert(sgeArr[2].val == 0x06);
    }
}
