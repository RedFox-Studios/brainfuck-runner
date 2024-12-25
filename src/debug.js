import chalk from 'chalk';

/**
 * Creates a visual representation of memory state
 * @param {Uint8Array} memory - The memory array
 * @param {number} pointer - Current pointer position
 * @param {number} windowSize - Number of cells to show on each side
 * @returns {string} Formatted memory state
 */
export function visualizeMemory(memory, pointer, windowSize = 5) {
    let view = '';
    for (let i = Math.max(0, pointer - windowSize); i <= Math.min(memory.length - 1, pointer + windowSize); i++) {
        if (i === pointer) {
            view += chalk.bgGreen(`[${memory[i]}]`) + ' ';
        } else {
            view += chalk.gray(`${memory[i]}`) + ' ';
        }
    }
    return view;
}

/**
 * Detects potential infinite loops
 * @param {number} pointer - Current memory pointer
 * @param {number} codePointer - Current code pointer
 * @param {number} memoryValue - Current memory value
 * @param {Set} history - Set of previous states
 * @returns {boolean} True if infinite loop detected
 */
export function detectInfiniteLoop(pointer, codePointer, memoryValue, history) {
    const state = `${pointer},${codePointer},${memoryValue}`;
    if (history.has(state)) {
        return true;
    }
    history.add(state);
    if (history.size > 1000) {
        history.clear();
    }
    return false;
}

/**
 * Creates a debug interface for the interpreter
 * @param {Object} params - Debug parameters
 * @returns {Object} Debug interface methods
 */
export function createDebugInterface({ 
    memory, 
    pointer, 
    output, 
    codePointer, 
    code, 
    iterations,
    rl,
    stepMode,
    setStepMode,
    setIsRunning
}) {
    async function showDebugInfo() {
        console.clear();
        console.log(chalk.blue('Debug Information:'));
        console.log(chalk.yellow('Memory State:'));
        console.log(visualizeMemory(memory, pointer));
        console.log(chalk.yellow('\nPointer Position:'), pointer);
        console.log(chalk.yellow('Current Value:'), memory[pointer]);
        console.log(chalk.yellow('Code Position:'), codePointer);
        console.log(chalk.yellow('Current Instruction:'), chalk.green(code[codePointer]));
        console.log(chalk.yellow('Output so far:'), output);
        console.log(chalk.yellow('Iterations:'), iterations);
        
        if (stepMode) {
            console.log(chalk.cyan('\nDebug Controls:'));
            console.log('c - Continue execution');
            console.log('s - Enable step mode');
            console.log('q - Quit execution');
            
            const command = await new Promise((resolve) => rl.question(chalk.green('Command (c/s/q): '), resolve));
            
            switch (command.toLowerCase()) {
                case 'q':
                    setIsRunning(false);
                    break;
                case 's':
                    setStepMode(true);
                    break;
                case 'c':
                    setStepMode(false);
                    break;
            }
        } else {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    return { showDebugInfo };
}