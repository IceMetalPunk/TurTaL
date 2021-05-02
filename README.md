# TurTaL /ˈtɝtəl/
## **TUR**ing **TA**pe **L**anguage

The TurTaL language (pronounced like "turtle") is an esoteric programming language based loosely on Alan Turing's original Turing machine description, with a couple of bits of syntactic sugar thrown in to reduce repetetive typing.

### **=Terms=**

The following terms are used throughout this document:

| Term | Definition |
| ---- | ---------- |
| Symbol | A nearly-arbitrary string |
| Tape | An array of symbols |
| State | A string indicating the current state of the program |
| Rule | A mapping of (symbol,state) pairs to (symbol,state,direction) triples |
| LHS | The Left-Hand Side of a rule (the pair) |
| RHS | The Right-Hand Side of a rule (the triple) |

Note that this document also refers to the program "throwing an error", which is a phrase used for generality. In the JavaScript TurTaL interpreter library, the interpreter returns a promise, so rather than "throwing an error", it will actually just reject the promise.

### **=NodeJS TurTaL Library=**

The NodeJS TurTaL library can be installed via a simple `npm install turtal` command. You can import the package like so:

`import Turtal from 'turtal';`

This exposes two methods, `parse` and `run`:

- `Turtal.parse(code_string)` will parse the given TurTaL code string and return a runnable TurTaL program.
- `Turtal.run(program[, callback])` will execute the given parsed TurTaL program and return a Promise which either resolves with the final tape array of the program, or rejects with any program errors.
- If the optional callback argument is passed to `run`, it should be a function with the signature `callback(tape, state, index)`. This will be called once on program execution and then once after each read/write/move iteration.
    - `tape` is the full array containing the current program tape.
    - `state` is the string of the current program state.
    - `index` is the current position about to be executed on the tape. This is 0-based; if the index would move into the negative, instead the entire tape is shifted 1 space to the right and a `'.'` is padded on the left, with the index remaining at `0`.

**Note:** If the program does not halt, there is no timeout to forcibly halt it, so be careful when writing your TurTaL programs not to introduce infinite execution. As the interpreter is Promise-based, this shouldn't lock up your entire Node script, but the Promise may never settle, and any callback passed will be called infinitely many times.

### **=Basic Structure=**

The basic structure of a TurTaL program consists of one or more rules, an optional initial state, and an optional initial tape definition, each on separate lines.

Whitespace within a line is stripped and ignored. (This also means you can't use whitespace as or in symbols or states.)

The syntax of a rule is as follows:

`READ_SYMBOL, CURRENT_STATE => WRITE_SYMBOL, NEW_STATE, DIRECTION`

This means, "if the state is `CURRENT_STATE` and the symbol on the tape at the current position is `READ_SYMBOL`, then overwrite it with `WRITE_SYMBOL`, set the state to `NEW_STATE`, and move in the given `DIRECTION`".

The possible directions you may use are:

| String | Name | Movement |
| ------ | ---- | -------- |
| <      | Left | Left     |
| >      | Right| Right    |
| (empty string) | None | No Movement|

The initial tape definition is optional. Any non-existent indexes will be padded with a `'.'` symbol. However, you may (and probably will) want to define some initial symbols on the tape, which you can do using a simple comma-separated list:

`SYM1,SYM2,A,B,ETC`

If you initialize your tape, it must be initialized with at least 4 symbols. You may explicitly use the `'.'` symbol as padding if you don't need 4.

The initial state definition is optional. The initial state is simply set to the value of the last line which contains no commas. If you do not specify a state this way, the default initial state is the empty string `''`. Note that this is a valid state, and a rule matching it would look something like this:

`READ_SYMBOL, => WRITE_SYMBOL, NEW_STATE, DIRECTION`

A program's execution starts at the first character of the defined tape (or the populated initial `'.'` if the tape is undefined), and it terminates and returns its final tape values if a rule is matched whose RHS is the special triple `',,'` (no write symbol, no new state, and no direction).

If the current `(read_symbol, state)` pair has no matching rule, the program will throw an error and terminate.

### **=Reserved Identifiers and Character Strings=**

Reserved identifiers cannot be used as an entire symbol or state, but may be used within such names:
- `'*'` = Wildcard
- `'+'` = Increment
- `'-'` = Decrement

Reserved character strings *cannot* be used within symbol or state names *at all*:
- `','` = Comma delimeter
- `'=>'` = Rule definition indicator

Reserved identifiers have the following functions:

| Identifier | Name | Meaning on LHS | Meaning on RHS | Can Replace |
| ----------- | ----------- | ----------- | ----------- |----------- |
| *      | Wildcard       | Anything | No Change | Symbol, State |
| + | Increment | N/A | Current Symbol + 1* | Symbol |
| - | Decrement | N/A | Current Symbol - 1* | Symbol |

\* An increment or decrement used on the RHS of a rule whose read symbol is non-numeric will throw an error and terminate the program.

A wildcard used on the LHS will match any symbol or state. A wildcard used on the RHS will leave the current symbol or state unchanged.

Rules will attempt to be matched from most specific to least specific, in this order:

1. A rule with a defined symbol and state
2. A rule with a defined state but a wildcard symbol
3. A rule with a defined symbol but a wildcard state
4. A generic rule with wildcard state and symbol

If none of the above rules are found for the current symbol and state pair, the program will throw an error and terminate.

### **=Example Programs=**

For each of these examples, the *Post-Processing* section describes how the results should be interpreted from the final tape array.

**Adder**

Add any number of pairs of numbers together:

    0, DEC => *, SKIP, >
    *, DEC => -, ADD, >
    *, ADD => +, DEC, <
    *, SKIP => *, SKIP, >
    ., SKIP => *, DEC, >
    ., DEC => ,,
    2,2,.,5,6,.,93,6,.,26,34
    DEC

*Explanation:*

This adds pairs of numbers together by decrementing the first value in 
the pair, incrementing the next value, and repeating until the first value is 0. Then it switches into the `SKIP` state, moving right until it finds a `'.'`, at which point it moves to the next symbol and starts over. This repeats until it finds two `'.'` symbols in a row (i.e. it reads a `'.'` while in the `DEC` state), at which point it terminates and outputs its tape.

Note that since this is naively decrementing the first value, if the first value is negative, this will create an infinite loop and freeze. Smarter modifications can be made to the program to handle that case better.

*Post-Processing:*

Every symbol with an index such that `(index - 1) % 3 === 0` will be the result of the corresponding addition. The other symbols will all be padding `'.'` or `'0'` from decremented counters, and can be filtered out/ignored.

**Subtractor**

Similarly, you can subtract any number of pairs of numbers:

    *, START => *, DEC, >
    0, DEC => *, SKIP, >
    *, DEC => -, SUB, <
    *, SUB => -, DEC, >
    *, SKIP => *, SKIP, >
    ., SKIP => *, START, >
    ., DEC => ,,
    2,2,.,5,6,.,93,6,.,26,34
    START

*Explanation:*

This works quite similarly to the Adder example, with one difference that's important to notice. Since subtraction is not commutative (the order of the numbers matters), we need to start all our subtraction operations using the *right* number as the counter to decrement and the *left* number to subtract from, the opposite of how the Adder works. To achieve this, we need to add an extra `START` state that allows us to skip the first symbol in each pair without skipping the second.

*Post-Processing:*

Since we're operating on the first value in each pair rather than the second, the results will be in every symbol with an index such that `index % 3 === 0` instead. This, however, will also include one last padding `'.'` symbol at the end, which can be filtered/ignored along with the other `'.'` and decremented `'0'` symbols.

**Comparator**

A small modification of the Subtractor can produce a program that succeeds if two numbers are equal, or throws if they are not:

    *, START => *, DEC, >
    0, DEC => *, CHECK, <
    *, DEC => -, SUB, <
    *, SUB => -, DEC, >
    0, CHECK => *, ACCEPT, >
    ., ACCEPT => ,,
    *, ACCEPT => *, *, >
    ., CHECK => *, FAIL,
    5,5,.,.
    START

*Explanation:*

This works like the subtractor, only it operates on a single pair of numbers instead of an arbitrary amount of them. It subtracts the second from the first, but then instead of going into a `SKIP` state and moving right, it instead goes into a `CHECK` state and moves left, back to the first number in the pair. If that number is a 0, then `symbol[0] - symbol[1] === 0`, which means the numbers are equal and we move into the `ACCEPT` state, which will ultimately reach a terminal `',,'` rule and successfully terminate. If, however, the `CHECK` state reads a `'.'`, it means it failed to find a 0 and the values were therefore not equal; it "reports" this by changing into the `FAIL` state (and not moving), which has no matching rules, thus resulting in a thrown error.

*Post-Processing:*

There is none. The Boolean result of this program is not output to the tape, it's represented by whether the program completes or throws an error. Many Boolean results can be structured this way. If desired, you could instead combine this program with concepts from the previous examples to produce something which can compare multiple pairs of numbers together, outputting `'true'` or `'false'` (or `'1'` or `'0'` or whatever you want) as symbols on the final tape for each pair.