"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DB {
    constructor() {
        this._db = new Map();
    }
    set(key, value) {
        this._db.set(key.toString('hex'), value);
    }
    get(key) {
        return this._db.get(key.toString('hex'));
    }
}
exports.DB = DB;
//# sourceMappingURL=db.js.map