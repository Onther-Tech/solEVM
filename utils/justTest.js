function estimateProofSize(accessedNodes, totalNodes){
    return accessedNodes * 32 * Math.log2(totalNodes / accessedNodes);
}
function accountProofSize(n) {
    return estimateProofSize(n, 2**28) + 112 * n;
}

function storageKeyProofSize(n) {
    return estimateProofSize(n, 2**24) + 32 * n;
}

// console.log(accountProofSize(1));
// console.log(storageKeyProofSize(1))

console.log(Math.log(1e12))
