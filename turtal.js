class Turtal {
    parse(programString) {
        const lines = programString.split(/\r?\n/);
        return lines.reduce((program, line) => {
            line = line.replace(/\s/g, '');
            if (line.replace(/[^,]/g, '').length < 3 && line.replace(/[^,]/g, '').length > 0) {
                throw new Error('Invalid code: ' + line);
            }
            else if (line.includes('=>')) {
                const [current, next] = line.split('=>');
                const rule = next.split(',');
                if (!(['', '>', '<'].includes(rule[2]))) {
                    throw new Error('Invalid rule direction');
                }
                program.mappings.set(current, next.split(','));
            }
            else if (line.includes(',')) {
                program.tape = line.split(',');
            }
            else {
                program.state = line;
            }
            return program;
        }, {
            tape: [],
            state: '',
            index: 0,
            mappings: new Map()
        });
    }
    run(program, callback = (() => { })) {
        while (program.index < 0) {
            program.tape.unshift('.');
            ++program.index;
        }
        while (program.index >= program.tape.length) {
            program.tape.push('.');
        }
        const symbol = program.tape[program.index];
        let ruleText = `${symbol},${program.state}`;
        const wildRule = `*,${program.state}`;
        const wildStateRule = `${symbol},*`;
        const allWild = '*,*';
        let rule = null;
        if (program.mappings.has(ruleText)) {
            rule = program.mappings.get(ruleText);
        } else if (program.mappings.has(wildRule)) {
            rule = program.mappings.get(wildRule);
            ruleText = wildRule;
        } else if (program.mappings.has(wildStateRule)) {
            rule = program.mappings.get(wildStateRule);
            ruleText = wildStateRule;
        } else if (program.mappings.has(allWild)) {
            rule = program.mappings.get(allWild);
            ruleText = allWild;
        } else {
            return Promise.reject(`Missing rule ${ruleText} at index ${program.index}`);
        }
        if (rule[0] === '' && rule[1] === '' && rule[2] === '') {
            return Promise.resolve(program.tape);
        }

        const numericValue = Number(symbol);
        if (rule[0] === '+') {
            if (isNaN(numericValue)) {
                return Promise.reject(`Symbol ${symbol} is non-numeric and can't be incremented with rule ${ruleText} at index ${program.index}.`);
            }
            program.tape[program.index] = `${numericValue + 1}`;
        } else if (rule[0] === '-') {
            if (isNaN(numericValue)) {
                return Promise.reject(`Symbol ${symbol} is non-numeric and can't be decremented with rule ${ruleText} at index ${program.index}.`);
            }
            program.tape[program.index] = `${numericValue - 1}`;
        } else if (rule[0] !== '*') {
            program.tape[program.index] = rule[0];
        }
        program.state = (rule[1] === '*') ? program.state : rule[1];
        program.index += (rule[2] === '>') ? 1 : (rule[2] === '<' ? -1 : 0);
        return Promise.resolve(callback(program)).then(() => this.run(program, callback));
    }
}

export default new Turtal();