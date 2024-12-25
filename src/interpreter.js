import chalk from 'chalk';
import readline from 'readline';
import { logger } from './logger.js';
import { detectInfiniteLoop, createDebugInterface } from './debug.js';

const MAX_ITERATIONS = 10000000; // 10 million iterations max

/**
 * Enhanced Brainfuck Interpreter with debug support
 * @param {string} code - The Brainfuck code to execute
 * @param {boolean} debug - Whether to run in debug mode
 * @returns {Object} Output and execution details
 */
export async function interpretBrainfuck(code, debug = false) {
    const memory = new Uint8Array(30000);
    let pointer = 0;
    let output = '';
    let codePointer = 0;
    const startTime = process.hrtime();
    
    // Execution control variables
    let iterations = 0;
    let isRunning = true;
    const loopHistory = new Set();
    let lastCodePointer = -1;
    let samePositionCount = 0;
    let stepMode = false;

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // Handle Ctrl+C and other termination signals
    process.on('SIGINT', () => {
        console.log(chalk.yellow('\nExecution interrupted by user'));
        isRunning = false;
        rl.close();
        process.exit(0);
    });

    const setStepMode = (value) => { stepMode = value; };
    const setIsRunning = (value) => { isRunning = value; };

    // Debug state tracking
    let breakpoints = [];

    // Find all breakpoints in code
    if (debug) {
        for (let i = 0; i < code.length; i++) {
            if (code[i] === '#') {
                breakpoints.push(i);
            }
        }
        if (breakpoints.length > 0) {
            console.log(chalk.blue('Breakpoints found at positions:'), breakpoints);
        }
    }

    // Remove breakpoints from code
    code = code.replace(/#/g, '');

    const debugInterface = debug ? createDebugInterface({
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
    }) : null;

    while (codePointer < code.length && isRunning) {
        // Check iteration limit
        if (iterations++ > MAX_ITERATIONS) {
            console.error(chalk.red('\nExecution timeout: Maximum iterations exceeded'));
            logger.error('Execution timeout');
            isRunning = false;
            break;
        }

        // Check for infinite loops
        if (codePointer === lastCodePointer) {
            samePositionCount++;
            if (samePositionCount > 1000 || 
                detectInfiniteLoop(pointer, codePointer, memory[pointer], loopHistory)) {
                console.error(chalk.red('\nPotential infinite loop detected'));
                logger.error('Infinite loop detected');
                isRunning = false;
                break;
            }
        } else {
            samePositionCount = 0;
        }
        lastCodePointer = codePointer;

        // Show debug information if needed
        if (debug && (stepMode || breakpoints.includes(codePointer))) {
            await debugInterface.showDebugInfo();
        }

        // Execute instruction
        switch (code[codePointer]) {
            case '>':
                pointer = (pointer + 1) % memory.length;
                break;
            case '<':
                pointer = pointer - 1 < 0 ? memory.length - 1 : pointer - 1;
                break;
            case '+':
                memory[pointer] = (memory[pointer] + 1) % 256;
                break;
            case '-':
                memory[pointer] = memory[pointer] - 1 < 0 ? 255 : memory[pointer] - 1;
                break;
            case '.':
                output += String.fromCharCode(memory[pointer]);
                break;
            case ',':
                const input = await new Promise((resolve) => 
                    rl.question(chalk.cyan('Input required (single character): '), resolve)
                );
                memory[pointer] = input.charCodeAt(0) || 0;
                break;
            case '[':
                if (memory[pointer] === 0) {
                    let bracketCount = 1;
                    while (bracketCount > 0) {
                        codePointer++;
                        if (code[codePointer] === '[') bracketCount++;
                        if (code[codePointer] === ']') bracketCount--;
                    }
                }
                break;
            case ']':
                if (memory[pointer] !== 0) {
                    let bracketCount = 1;
                    while (bracketCount > 0) {
                        codePointer--;
                        if (code[codePointer] === '[') bracketCount--;
                        if (code[codePointer] === ']') bracketCount++;
                    }
                }
                break;
        }
        codePointer++;
    }

    rl.close();
    const endTime = process.hrtime(startTime);
    const executionTime = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);

    return { 
        output, 
        executionTime,
        iterations,
        status: isRunning ? 'completed' : 'terminated'
    };
}