import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { interpretBrainfuck } from './interpreter.js';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Run Command Handler
 * Executes a Brainfuck script from the bf-scripts directory
 */
export async function handleRun(filename, options) {
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
}

/**
 * List Command Handler
 * Lists all available Brainfuck scripts in the bf-scripts directory
 */
export async function handleList() {
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
}