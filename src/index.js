#!/usr/bin/env node

/**
 * Brainfuck Runner - A CLI tool for executing Brainfuck scripts
 * Enhanced version with debugging capabilities and breakpoint support
 */

import { Command } from 'commander';
import { handleRun, handleList } from './commands.js';

// CLI Program Configuration
const program = new Command();

program
    .name('brainfuck-runner')
    .description('CLI to run Brainfuck scripts')
    .version('1.0.0');

program
    .command('run <filename>')
    .description('Run a Brainfuck script')
    .option('-d, --debug', 'Enable debug mode')
    .option('-t, --timeout <number>', 'Set maximum execution time in seconds', '60')
    .action(handleRun);

program
    .command('list')
    .description('List all available Brainfuck scripts')
    .action(handleList);

// Parse command line arguments
program.parse();