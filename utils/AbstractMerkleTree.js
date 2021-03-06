'use strict';

const ethers = require('ethers');
const { ZERO_HASH } = require('./constants');

module.exports = class AbstractMerkleTree {
  static hash (left, right) {
    return ethers.utils.solidityKeccak256(
      ['bytes32', 'bytes32'],
      [left, right]
    );
  }

  static zero () {
    return {
      left: {
        hash: ZERO_HASH,
      },
      right: {
        hash: ZERO_HASH,
      },
      hash: ZERO_HASH,
    };
  }

  constructor () {
    this.tree = [[]];
  }

  get leaves () {
    return this.tree[0];
  }

  get root () {
    return this.tree[this.tree.length - 1][0];
  }

  get depth () {
    // we also count leaves
    return this.tree.length;
  }

  getNode (hash) {
    let len = this.tree.length;

    while (len--) {
      let x = this.tree[len];

      let iLen = x.length;
      while (iLen--) {
        let y = x[iLen];
        if (y.hash === hash) {
          return y;
        }
      }
    }

    return null;
  }

  getPair (leftHash, rightHash) {
    let len = this.tree.length;

    while (len--) {
      let x = this.tree[len];

      let iLen = x.length;
      while (iLen--) {
        let y = x[iLen];
        if (y.left.hash === leftHash && y.right.hash === rightHash) {
          return y;
        }
      }
    }

    return null;
  }

  recal (baseLevel) {
    if (baseLevel === undefined) {
      baseLevel = 0;
    }
    let level = baseLevel + 1;
    // clear everything from level and above
    this.tree = this.tree.slice(0, level);
    while (true) {
      let last = this.tree[level - 1];
      let cur = [];

      if (last.length <= 1 && level > 1) {
        // done
        break;
      }

      let len = last.length;
      for (let i = 0; i < len; i += 2) {
        let left = last[i];
        let right = last[i + 1];

        if (!right) {
          right = this.constructor.zero();
          last.push(right);
        }

        cur.push(
          {
            left: left,
            right: right,
            hash: this.constructor.hash(left.hash, right.hash),
          }
        );
      }

      this.tree.push(cur);
      level++;
    }
  }

  printTree () {
    let res = '';

    for (let i = 0; i < this.tree.length; i++) {
      const row = this.tree[i];

      res += `level ${i}: `;
      for (let y = 0; y < row.length; y++) {
        const e = row[y];
        const h = e.hash.substring(2, 6);
        const hl = e.left ? e.left.hash.substring(2, 6) : '?';
        const hr = e.right ? e.right.hash.substring(2, 6) : '?';
        
                
        res += `[ ${h} (l:${hl} r:${hr}) ] \n`;
      }

      res += '\n';
    }
    let depth = this.tree.length;
    res += `${depth}`;
    return res;
  }

  printLeave () {
    let res = '';

    const row = this.tree[0];

     
    for (let y = 0; y < row.length; y++) {
      const e = row[y];
      const h = e.hash.substring(2, 6);
      const hl = e.left ? e.left.hash.substring(2, 6) : '?';
      const hr = e.right ? e.right.hash.substring(2, 6) : '?';
      const dep = e.callDepth;
      const isStart = e.isFirstExecutionStep;
      const isEnd = e.isEndExecutionStep;
              
      res += ` callDepth: ${dep}, ${isStart}, ${isEnd} [ ${h} (l:${hl} r:${hr}) ] \n`;
    }

    res += '\n';
       
    return res;
  }
};
