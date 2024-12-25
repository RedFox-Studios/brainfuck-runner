#!/usr/bin/env node

/**
 * Brainfuck Runner - A CLI tool for executing Brainfuck scripts
 * 
 * This tool provides functionality to:
 * - Execute Brainfuck scripts from the bf-scripts directory
 * - List available scripts
 * - Log execution details and errors
 * 
 * @author RedFox-Studios
 * @version 1.0.0
 */

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import winston from 'winston';

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
 * Brainfuck Interpreter
 * Executes Brainfuck code according to the standard specification:
 * > : Move pointer right
 * < : Move pointer left
 * + : Increment current cell
 * - : Decrement current cell
 * . : Output current cell value as ASCII
 * , : Input value (not implemented yet)
 * [ : Jump forward to matching ] if current cell is 0
 * ] : Jump back to matching [ if current cell is not 0
 *
 * @param {string} code - The Brainfuck code to execute
 * @returns {string} The output of the program
 */
function interpretBrainfuck(code) {
    // Initialize memory array (30,000 cells as per common implementation)
    const memory = new Uint8Array(30000);
    let pointer = 0;          // Current memory cell pointer
    let output = '';          // Program output
    let codePointer = 0;      // Current instruction pointer

    while (codePointer < code.length) {
        switch (code[codePointer]) {
            case '>':
                // Move pointer right (with wrap-around)
                pointer = (pointer + 1) % memory.length;
                break;
            case '<':
                // Move pointer left (with wrap-around)
                pointer = pointer - 1 < 0 ? memory.length - 1 : pointer - 1;
                break;
            case '+':
                // Increment current cell (with wrap-around at 255)
                memory[pointer] = (memory[pointer] + 1) % 256;
                break;
            case '-':
                // Decrement current cell (with wrap-around at 0)
                memory[pointer] = memory[pointer] - 1 < 0 ? 255 : memory[pointer] - 1;
                break;
            case '.':
                // Output current cell value as ASCII character
                output += String.fromCharCode(memory[pointer]);
                break;
            case '[':
                // Skip to matching ] if current cell is 0
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
                // Return to matching [ if current cell is not 0
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
    return output;
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
 * Usage: brainfuck-runner run <filename>
 */
program
    .command('run <filename>')
    .description('Run a Brainfuck script')
    .action(async (filename) => {
        try {
            // Construct path to script file
            const scriptPath = path.join(__dirname, '../bf-scripts', filename);
            
            // Check if script exists
            if (!fs.existsSync(scriptPath)) {
                console.error(chalk.red(`Error: Script ${filename} not found in bf-scripts directory`));
                logger.error(`Script not found: ${filename}`);
                return;
            }

            // Read and execute script
            const script = await fs.readFile(scriptPath, 'utf-8');
            console.log(chalk.blue('Running script:', filename));
            logger.info(`Running script: ${filename}`);
            
            // Execute and display results
            const result = interpretBrainfuck(script);
            console.log(chalk.green('\nOutput:'), result);
            logger.info(`Script execution completed: ${filename}`, { output: result });

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