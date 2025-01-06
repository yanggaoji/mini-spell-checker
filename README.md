[中文版](./README_CN.md)

# Mini Spell Checker

A lightweight spell checker extension designed for legacy Visual Studio Code and VSCode-like editors.

## Key Benefits

- Compatible with older VSCode engine versions (1.45.0+)
- Works with VSCode-like editors (e.g. WeChat Developer Tools)
- Minimal dependencies and lightweight implementation
- Perfect for environments where mainstream spell checkers cannot be installed

## Features

- Real-time spell checking for English words
- Built-in dictionary support
- Custom user dictionary
- Support for multiple file types (plaintext, markdown, javascript, typescript)
- Quick fix suggestions for unknown words

## Installation

1. Download the .vsix file from the releases page
2. Install via: `code --install-extension mini-spell-checker-1.0.0.vsix`
3. Reload VS Code

## Usage

- The extension automatically checks spelling as you type
- Unknown words will be underlined with a warning
- Click on underlined words to:
  - Add them to your user dictionary
  - See suggestions

## Commands

- `Spell Checker: Reload Dictionary`: Reload the main dictionary
- `Add Word to User Dictionary`: Add selected word to user dictionary

## Configuration

```json
{
  "spellChecker.enabled": true,
  "spellChecker.languages": [
    "plaintext",
    "markdown",
    "javascript",
    "typescript"
  ]
}
```

## Compatibility

- Visual Studio Code v1.45.0 and above
- VSCode-based editors including:
  - WeChat Developer Tools
  - Other editors using the VSCode engine

## Known Limitations

- Only supports English spell checking
- No external API dependencies
- Uses basic dictionary approach for maximum compatibility

## Dictionary Format

The spell checker uses simple text files (`.txt`) for both main dictionary and user dictionary, with one word per line.

- `dictionary.txt`: Main dictionary file
- `userDictionary.txt`: Custom user words

## Dictionary Data Credits

The default dictionary data is derived from the [high-frequency-vocabulary](https://github.com/arstgit/high-frequency-vocabulary) project, which contains a list of the 30,000 most common English words in order of frequency. The data is:

- Based on Peter Norvig's compilation of the 1/3 million most frequent English words
- Includes dictionary explanations for each word

### License for Dictionary Data

Open source and free to use for any purpose.

## License

MIT
