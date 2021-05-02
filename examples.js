import Turtal from "./index.js";

/* This implements the example TurTaL programs mentioned in the README and outputs their results. */

// Adder
const addCode = `0, DEC => *, SKIP, >
*, DEC => -, ADD, >
*, ADD => +, DEC, <
*, SKIP => *, SKIP, >
., SKIP => *, DEC, >
., DEC => ,,
2,2,.,5,6,.,93,6,.,26,34
DEC`;

const adder = Turtal.parse(addCode);
Turtal.run(adder)
.then(result => {
    const processed = result.filter((_, i) => (i - 1) % 3 ===0);
    console.log('Adder: ', processed);
});

// Subtractor
const subtractCode = `*, START => *, DEC, >
0, DEC => *, SKIP, >
*, DEC => -, SUB, <
*, SUB => -, DEC, >
*, SKIP => *, SKIP, >
., SKIP => *, START, >
., DEC => ,,
2,2,.,5,6,.,93,6,.,26,34
START`

const subtractor = Turtal.parse(subtractCode);
Turtal.run(subtractor)
.then(result => {
    const processed = result.filter((v, i) => i % 3 ===0 && v !== '.');
    console.log('Subtractor: ', processed);
});

// Comparator - Success

const comparatorSuccessCode = `*, START => *, DEC, >
0, DEC => *, CHECK, <
*, DEC => -, SUB, <
*, SUB => -, DEC, >
0, CHECK => *, ACCEPT, >
., ACCEPT => ,,
*, ACCEPT => *, *, >
., CHECK => *, FAIL,
5,5,.,.
START`

const comparatorSuccess = Turtal.parse(comparatorSuccessCode);
Turtal.run(comparatorSuccess)
.then(() => {
    console.log('Comparator 5,5: Values are equal');
})
.catch(() => {
    console.log('Comparator 5,5: Values are not equal')
});

// Comparator - Failure

const comparatorFailCode = `*, START => *, DEC, >
0, DEC => *, CHECK, <
*, DEC => -, SUB, <
*, SUB => -, DEC, >
0, CHECK => *, ACCEPT, >
., ACCEPT => ,,
*, ACCEPT => *, *, >
., CHECK => *, FAIL,
65,234,.,.
START`

const comparatorFail = Turtal.parse(comparatorFailCode);
Turtal.run(comparatorFail)
.then(() => {
    console.log('Comparator 65,234: Values are equal');
})
.catch(() => {
    console.log('Comparator 65,234: Values are not equal')
});