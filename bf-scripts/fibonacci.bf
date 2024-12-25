# Print numbers 1-5 of fibonacci sequence
# First number (1)
>+
# Second number (1)
>+
# Counter
>>+++++ 

# Main loop
[
    # Print current number
    <<
    # Convert to ASCII number
    >++++++++++[<++++++++++>-]<
    .
    # Print newline
    >++++++++++.
    
    # Calculate next number
    <[-]  # Clear ASCII conversion
    # Add previous numbers
    <[>>+>+<<<-]>>>[<<<+>>>-]
    <<[>[>+>+<<-]>>[<<+>>-]<<<-]
    
    # Move back and decrement counter
    <<<<-
]