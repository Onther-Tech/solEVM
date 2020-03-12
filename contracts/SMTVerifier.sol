pragma solidity ^0.5.2;


// Based on javascript implementation of Loom Network
// https://github.com/loomnetwork/plasma-cash/blob/master/server/contracts/Core/SparseMerkleTree.sol
// Original Code for the sparse merkle tree came from Wolkdb Plasma

contract SMTVerifier {

    uint16 constant DEPTH = 256;
    function checkMembership(
        bytes32 key,
        bytes32 leaf,
        bytes32 root,
        bytes memory proof) public view returns (bool)
    {
        bytes32 computedHash = getRoot(key, leaf, proof);
        return (computedHash == root);
    }

    function getRoot(bytes32 key, bytes32 leaf, bytes memory proof) public view returns (bytes32) {
        require((proof.length) % 32 == 0 && proof.length <= 8192, "invalid proof length");
        bytes32 proofElement;
        bytes32 computedHash = leaf;
        uint256 p = 8192;
        
        for (uint d = 0; d < DEPTH; d++) {
            require(proof.length >= p, "invalid p");
            assembly { proofElement := mload(add(proof, p)) }
            bytes32 getPathDirection = key & (bytes32(uint(1)) << d);
            uint direction = uint(getPathDirection >> d);
            if (direction == uint(0)) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
            p -= 32;
        }
        return computedHash;
    }
}