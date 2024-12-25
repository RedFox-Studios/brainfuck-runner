#!/usr/bin/env node

/**
 * Brainfuck Runner - A CLI tool for executing Brainfuck scripts
 * Enhanced version with debugging capabilities and breakpoint support
 */

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import winston from 'winston';
import readline from 'readline';

// Convert ESM module URLs to filesystem paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Logger Configuration
 * - Logs are stored in the /logs directory
 * - Error logs are separated from general logs
 * - Each log entry includes a timestamp
 */
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/error.log'), 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/combined.log') 
        })
    ]
});

/**
 * Creates a visual representation of memory state
 * @param {Uint8Array} memory - The memory array
 * @param {number} pointer - Current pointer position
 * @param {number} windowSize - Number of cells to show on each side
 * @returns {string} Formatted memory state
 */
function visualizeMemory(memory, pointer, windowSize = 5) {
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
function detectInfiniteLoop(pointer, codePointer, memoryValue, history) {
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
 * Enhanced Brainfuck Interpreter with debug support
 * @param {string} code - The Brainfuck code to execute
 * @param {boolean} debug - Whether to run in debug mode
 * @returns {Object} Output and execution details
 */
async function interpretBrainfuck(code, debug = false) {
    const memory = new Uint8Array(30000);
    let pointer = 0;
    let output = '';
    let codePointer = 0;
    const startTime = process.hrtime();
    
    // Execution control variables
    const MAX_ITERATIONS = 10000000; // 10 million iterations max
    let iterations = 0;
    let isRunning = true;
    const loopHistory = new Set();
    let lastCodePointer = -1;
    let samePositionCount = 0;

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

    const question = (query) => new Promise((resolve) => rl.question(query, resolve));

    // Debug state tracking
    let stepMode = false;
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
        
        if (stepMode || breakpoints.includes(codePointer)) {
            console.log(chalk.cyan('\nDebug Controls:'));
            console.log('c - Continue execution');
            console.log('s - Enable step mode');
            console.log('q - Quit execution');
            
            const command = await question(chalk.green('Command (c/s/q): '));
            
            switch (command.toLowerCase()) {
                case 'q':
                    isRunning = false;
                    break;
                case 's':
                    stepMode = true;
                    break;
                case 'c':
                    stepMode = false;
                    break;
            }
        } else if (debug) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

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
            await showDebugInfo();
        } else if (debug) {
            await showDebugInfo();
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
                const input = await question(chalk.cyan('Input required (single character): '));
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

    if (debug) {
        console.log(chalk.blue('\nExecution completed!'));
        console.log(chalk.yellow('Final Memory State:'));
        console.log(visualizeMemory(memory, pointer));
        console.log(chalk.yellow('Total Iterations:'), iterations);
        console.log(chalk.yellow('Execution Time:'), `${executionTime}ms`);
    }

    return { 
        output, 
        executionTime,
        iterations,
        status: isRunning ? 'completed' : 'terminated'
    };
}

// CLI Program Configuration
const program = new Command();

program
    .name('brainfuck-runner')
    .description('CLI to run Brainfuck scripts')
    .version('1.0.0');

/**
 * Run Command
 * Executes a Brainfuck script from the bf-scripts directory
 * Usage: brainfuck-runner run <filename> [options]
 */
program
    .command('run <filename>')
    .description('Run a Brainfuck script')
    .option('-d, --debug', 'Enable debug mode')
    .option('-t, --timeout <number>', 'Set maximum execution time in seconds', '60')
    .action(async (filename, options) => {
        try {
            const scriptPath = path.join(__dirname, '../bf-scripts', filename);
            
            if (!fs.existsSync(scriptPath)) {
                console.error(chalk.red(`Error: Script ${filename} not found in bf-scripts directory`));
                logger.error(`Script not found: ${filename}`);
                return;
            }

            console.log(chalk.blue('Running script:', filename));
            console.log(chalk.gray('Press Ctrl+C to stop execution'));
            
            const script = await fs.readFile(scriptPath, 'utf-8');
            logger.info(`Running script: ${filename}`);
            
            const { output, executionTime, iterations, status } = await interpretBrainfuck(script, options.debug);
            
            if (!options.debug) {
                if (status === 'completed') {
                    console.log(chalk.green('\nOutput:'), output);
                    console.log(chalk.yellow('Execution Time:'), `${executionTime}ms`);
                    console.log(chalk.yellow('Total Iterations:'), iterations);
                } else {
                    console.log(chalk.yellow('\nPartial Output:'), output);
                }
            }
            
            logger.info(`Script execution ${status}: ${filename}`, { 
                output, 
                executionTime,
                iterations,
                debug: options.debug,
                status 
            });

        } catch (error) {
            console.error(chalk.red('Error:', error.message));
            logger.error('Error running script:', { error: error.message });
        }
    });

/**
 * List Command
 * Lists all available Brainfuck scripts in the bf-scripts directory
 * Usage: brainfuck-runner list
 */
program
    .command('list')
    .description('List all available Brainfuck scripts')
    .action(async () => {
        try {
            const scriptsDir = path.join(__dirname, '../bf-scripts');
            const files = await fs.readdir(scriptsDir);
            
            if (files.length === 0) {
                console.log(chalk.yellow('No scripts found in bf-scripts directory'));
                return;
            }

            console.log(chalk.blue('Available scripts:'));
            files.forEach(file => {
                if (file !== '.gitkeep') {
                    console.log(chalk.green(`- ${file}`));
                }
            });
        } catch (error) {
            console.error(chalk.red('Error:', error.message));
            logger.error('Error listing scripts:', { error: error.message });
        }
    });

// Parse command line arguments
program.parse();