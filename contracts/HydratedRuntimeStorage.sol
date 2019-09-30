pragma solidity ^0.5.2;
pragma experimental ABIEncoderV2;

import "./EVMRuntimeStorage.sol";


contract HydratedRuntimeStorage is EVMRuntimeStorage {

    struct HydratedState {
        bytes32 stackHash;
        bytes32 memHash;
        bytes32 tStorageHash;
        bytes32 logHash;
    }

    function initHydratedState(EVM memory evm) internal pure returns (HydratedState memory hydratedState) {
        uint ptr;

        assembly {
            ptr := hydratedState
        }

        evm.customDataPtr = ptr;
    }

    function getHydratedState(EVM memory evm) internal pure returns (HydratedState memory) {
        HydratedState memory res;
        uint ptr = evm.customDataPtr;

        assembly {
            res := ptr
        }

        return res;
    }

    function updateHydratedState(EVM memory evm) internal pure {
        // TODO:
        // gather all proofs here
        // How we compute the proofs below is not final yet.
        // Update memory proofs setup to use slot, value, once off-chain support lands.
        HydratedState memory hydratedState = getHydratedState(evm);

        bytes32 hash = hydratedState.stackHash;
        uint ptr = evm.stack.dataPtr;

        for (uint i = 0; i < evm.stack.size; i++) {
            assembly {
                mstore(0, hash)
                mstore(0x20, mload(add(ptr, mul(i, 0x20))))
                hash := keccak256(0, 0x40)
            }
        }
        hydratedState.stackHash = hash;

        bytes32[] memory mem = evm.mem.toArray();
        if (mem.length > 0) {
            hydratedState.memHash = keccak256(abi.encodePacked(mem));
        }

        bytes32[] memory tStorage = evm.tStorage.toArrayForHash();
        if (tStorage.length > 0) {
            hydratedState.tStorageHash = keccak256(abi.encodePacked(tStorage));
        }

        (uint[] memory logs, bytes memory data) = evm.logs.toArray();
        if ( logs.length != 0 && data.length != 0 ) {
            uint[4] memory topics;
            uint account = logs[0];

            topics[0] = logs[1];
            topics[1] = logs[2];
            topics[2] = logs[3];
            topics[3] = logs[4];

            hydratedState.logHash = keccak256(
                abi.encodePacked(
                    hydratedState.logHash,
                    account,
                    topics,
                    data
                )
            );
        }
    }

    function _run(EVM memory evm, uint pc, uint pcStepCount) internal {
        super._run(evm, pc, pcStepCount);
        updateHydratedState(evm);
    }
}
