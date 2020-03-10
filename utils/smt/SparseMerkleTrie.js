"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const ethereumjs_util_1 = require("ethereumjs-util");
const db_1 = require("./db");
const KEY_SIZE = 32;
const DEPTH = KEY_SIZE * 8;
const EMPTY_VALUE = ethereumjs_util_1.zeros(KEY_SIZE);
var Direction;
(function (Direction) {
    Direction[Direction["Left"] = 0] = "Left";
    Direction[Direction["Right"] = 1] = "Right";
})(Direction || (Direction = {}));
/**
 * Sparse Merkle tree
 */
class SMT {
    constructor(hasher = ethereumjs_util_1.sha256) {
        this._hasher = hasher;
        this._db = new db_1.DB();
        this._defaultValues = new Array(DEPTH + 1);
        let h = EMPTY_VALUE;
        this._defaultValues[256] = h;
        for (let i = DEPTH - 1; i >= 0; i--) {
            const newH = this.hash(Buffer.concat([h, h]));
            this._db.set(newH, Buffer.concat([h, h]));
            this._defaultValues[i] = newH;
            h = newH;
        }
        this._root = h;
    }
    get root() {
        return this._root;
    }
    putData(key, value) {
        assert(key.byteLength === KEY_SIZE, `Key must be of size ${KEY_SIZE}`);
        let v = this._root;
        const siblings = [];
        for (let i = 0; i < DEPTH; i++) {
            const direction = getPathDirection(key, i);
            const res = this._db.get(v);
            if (!res)
                throw new Error('Value not found in db');
            if (direction === Direction.Left) {
                v = res.slice(0, 32);
                siblings.push([direction, res.slice(32, 64)]);
            }
            else {
                v = res.slice(32, 64);
                siblings.push([direction, res.slice(0, 32)]);
            }
        }
        if (value) {
            v = this.hash(value);
            this._db.set(v, value);
        }
        else {
            v = EMPTY_VALUE;
        }
        for (let i = DEPTH - 1; i >= 0; i--) {
            const [direction, sibling] = siblings.pop();
            let h;
            if (direction === Direction.Left) {
                h = this.hash(Buffer.concat([v, sibling]));
                this._db.set(h, Buffer.concat([v, sibling]));
            }
            else {
                h = this.hash(Buffer.concat([sibling, v]));
                this._db.set(h, Buffer.concat([sibling, v]));
            }
            v = h;
        }
        this._root = v;
    }
    getData(key) {
        assert(key.byteLength === KEY_SIZE, `Key must be of size ${KEY_SIZE}`);
        let v = this._root;
        for (let i = 0; i < DEPTH; i++) {
            const direction = getPathDirection(key, i);
            const res = this._db.get(v);
            if (!res)
                throw new Error('Value not found in db');
            if (direction === Direction.Left) {
                v = res.slice(0, 32);
            }
            else {
                v = res.slice(32, 64);
            }
        }
        return v.equals(EMPTY_VALUE) ? undefined : this._db.get(v);
    }
    getProof(key) {
        let v = this._root;
        const siblings = [];
        for (let i = 0; i < DEPTH; i++) {
            const direction = getPathDirection(key, i);
            const res = this._db.get(v);
            if (!res)
                throw new Error('Value not found in db');
            if (direction === Direction.Left) {
                v = res.slice(0, 32);
                siblings.push(res.slice(32, 64));
            }
            else {
                v = res.slice(32, 64);
                siblings.push(res.slice(0, 32));
            }
        }
        return siblings;
    }
    verifyProof(proof, root, key, value) {
        assert(proof.length === DEPTH, 'Incorrect proof length');
        let v;
        if (value) {
            v = this.hash(value);
        }
        else {
            v = EMPTY_VALUE;
        }
        for (let i = DEPTH - 1; i >= 0; i--) {
            const direction = getPathDirection(key, i);
            if (direction === Direction.Left) {
                v = this.hash(Buffer.concat([v, proof[i]]));
            }
            else {
                v = this.hash(Buffer.concat([proof[i], v]));
            }
        }
        return v.equals(root);
    }
    verifyCompactProof(cproof, root, key, value) {
        const proof = this.decompressProof(cproof);
        return this.verifyProof(proof, root, key, value);
    }
    compressProof(proof) {
        const bits = Buffer.alloc(KEY_SIZE);
        const newProof = [];
        for (let i = 0; i < DEPTH; i++) {
            if (proof[i].equals(this._defaultValues[i + 1])) {
                bits[Math.floor(i / 8)] ^= 1 << (7 - (i % 8));
            }
            else {
                newProof.push(proof[i]);
            }
        }
        return { bitmask: bits, proof: newProof };
    }
    decompressProof(cproof) {
        const proof = [];
        const proofNodes = cproof.proof.reverse();
        for (let i = 0; i < DEPTH; i++) {
            if (cproof.bitmask[Math.floor(i / 8)] & (1 << (7 - (i % 8)))) {
                proof.push(this._defaultValues[i + 1]);
            }
            else {
                const v = proofNodes.pop();
                if (v === undefined) {
                    throw new Error('Invalid compact proof');
                }
                proof.push(v);
            }
        }
        return proof;
    }
    hash(value) {
        return this._hasher(value);
    }
}
exports.SMT = SMT;
function getPathDirection(path, i) {
    const byte = path[Math.floor(i / 8)];
    const bit = byte & (1 << (7 - (i % 8)));
    return bit === 0 ? Direction.Left : Direction.Right;
}
//# sourceMappingURL=index.js.map