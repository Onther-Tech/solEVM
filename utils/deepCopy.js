let obj1 = {
    a: 1,
    b: 2
}

let obj2 = {
    c: 3,
    d: 4
}

console.log(obj1);
console.log(obj2);

obj1 = obj2;

console.log(obj1);
console.log(obj2);

obj2.a = 5

console.log(obj1);
console.log(obj2);
