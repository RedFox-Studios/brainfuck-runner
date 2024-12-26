# Brainfuck Runner

A command-line tool for executing Brainfuck scripts with debugging capabilities and real-time memory visualization.

## Features

- 🚀 Execute Brainfuck scripts from the command line
- 🔍 Debug mode with memory state visualization
- 💡 Breakpoint support using '#' in scripts
- 📊 Real-time execution statistics
- 📝 Comprehensive logging system
- ⚡ Infinite loop detection and prevention
- 🎯 Step-by-step execution in debug mode
- 📂 Script management in `/bf-scripts` directory

## Installation

1. Clone the repository:
```bash
git clone https://github.com/RedFox-Studios/brainfuck-runner.git
```

2. Navigate to the project directory:

```shellscript
cd brainfuck-runner
```

3. Install dependencies:

```shellscript
npm install
```

## Usage

### Basic Commands

1. Run a Brainfuck script:


```shellscript
npm start run <filename>
```

2. List available scripts:

```shellscript
npm start list
```

3. Run with debug mode:

```shellscript
npm start run <filename> -d
```

### Debug Mode Controls

When running in debug mode (-d flag), you can use the following commands:

- `c` - Continue execution
- `s` - Enable step mode
- `q` - Quit execution


### Example Scripts

Place your Brainfuck scripts in the `/bf-scripts` directory. Here's a simple "Hello World" script example:

```plaintext
++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.
```

### Breakpoints

You can add breakpoints to your scripts using the '#' character:

```plaintext
+++++     # Initialize counter
#         # Breakpoint before loop
[>+.<-]   # Print sequence
```

## Features in Detail

### Memory Visualization

In debug mode, the tool provides a visual representation of the memory state:

```plaintext
Memory State:
0 0 [5] 0 0 0 0 0 0 0
```

### Execution Statistics

After running a script, you'll see:

- Execution time
- Total iterations
- Final memory state (in debug mode)


### Logging

All executions are logged in the `/logs` directory:

- `error.log` - Error messages
- `combined.log` - All execution information


## Project Structure

```plaintext
brainfuck-runner/
├── src/
│   ├── index.js        # Main entry point
│   ├── interpreter.js   # Brainfuck interpreter
│   ├── debug.js        # Debug utilities
│   ├── logger.js       # Logging configuration
│   └── commands.js     # CLI commands
├── bf-scripts/         # Brainfuck scripts directory
└── logs/              # Execution logs
```

## Error Handling

The runner includes several safety features:

- Maximum iteration limit (10 million)
- Infinite loop detection
- Memory bounds checking
- Error logging


## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Original Brainfuck language by Urban Müller
- Node.js and npm community
- Contributors and users of this tool


## Support

If you encounter any issues or have questions, please:

1. Check the existing issues
2. Create a new issue with a detailed description
3. Include relevant script samples and error messages


---

Made with ❤️ by Michal Flaška 

`P.S., (I almost died in the process)`
