const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

class DictionaryManager {
  constructor(dictionaryFolder) {
    this.dictionaryFolder = dictionaryFolder;
    this.dictionary = new Set();
    this.userDictionary = new Set();
    this.lastLoadTime = 0;
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
  }

  loadAllDictionaries() {
    const now = Date.now();
    if (now - this.lastLoadTime < this.cacheTimeout) {
      return;
    }

    try {
      const dictionaryFiles = this.scanDictionaryFiles();
      dictionaryFiles.forEach((file) => {
        const words = this.loadDictionary(file);
        if (file.includes("userDictionary")) {
          this.userDictionary = new Set(words);
        } else {
          words.forEach((word) => this.dictionary.add(word));
        }
      });

      this.lastLoadTime = now;
      console.log(`Loaded ${this.dictionary.size} words from dictionary`);
      console.log(
        `Loaded ${this.userDictionary.size} words from user dictionary`
      );
    } catch (error) {
      console.error("Failed to load dictionaries:", error);
      vscode.window.showErrorMessage("Failed to load dictionaries");
    }
  }

  scanDictionaryFiles() {
    try {
      return fs
        .readdirSync(this.dictionaryFolder)
        .filter(
          (file) => file.startsWith("dictionary") && file.endsWith(".txt")
        )
        .map((file) => path.join(this.dictionaryFolder, file));
    } catch (error) {
      console.error("Failed to scan dictionary folder:", error);
      return [];
    }
  }

  loadDictionary(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        return fs
          .readFileSync(filePath, "utf8")
          .split(/\r?\n/)
          .map((line) => line.trim().toLowerCase())
          .filter((line) => line.length > 0);
      }
      return [];
    } catch (error) {
      console.error(`Failed to load dictionary ${filePath}:`, error);
      return [];
    }
  }

  async addToUserDictionary(word) {
    word = word.trim().toLowerCase();
    if (this.userDictionary.has(word)) {
      return false;
    }

    try {
      const userDictionaryPath = path.join(
        this.dictionaryFolder,
        "userDictionary.txt"
      );
      await fs.promises.appendFile(userDictionaryPath, word + "\n");
      this.userDictionary.add(word);
      return true;
    } catch (error) {
      console.error("Failed to add word to dictionary:", error);
      throw error;
    }
  }
}

class SpellChecker {
  constructor(dictionaryManager) {
    this.dictionaryManager = dictionaryManager;
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection("spellChecker");
    this.wordPattern =
      /\b[a-zA-Z]+(?:[-_][a-zA-Z]+)*\b|\b[a-z]+(?:[A-Z][a-z]*)*\b/g;
  }

  checkDocument(document) {
    const config = vscode.workspace.getConfiguration("miniSpellChecker");
    if (!this.shouldCheckDocument(document, config)) {
      this.diagnosticCollection.delete(document.uri);
      return;
    }

    const diagnostics = this.findSpellingErrors(document);
    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  shouldCheckDocument(document, config) {
    const isEnabled = config.get("enabled");
    const enabledLanguages = config.get("enabledLanguages");
    return isEnabled && enabledLanguages.includes(document.languageId);
  }

  findSpellingErrors(document) {
    const text = document.getText();
    const diagnostics = [];
    let match;

    while ((match = this.wordPattern.exec(text)) !== null) {
      const diagnostic = this.checkWord(document, match);
      if (diagnostic) {
        diagnostics.push(diagnostic);
      }
    }

    return diagnostics;
  }

  checkWord(document, match) {
    const compound = match[0];
    const words = splitCompoundWord(compound);
    const unknownWords = [];

    for (const word of words) {
      if (
        !this.dictionaryManager.dictionary.has(word.toLowerCase()) &&
        !this.dictionaryManager.userDictionary.has(word.toLowerCase())
      ) {
        unknownWords.push(word);
      }
    }

    if (unknownWords.length > 0) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + compound.length);
      const range = new vscode.Range(startPos, endPos);

      const message =
        unknownWords.length === 1
          ? `Unknown word part: "${unknownWords[0]}" in "${compound}"`
          : `Multiple unknown word parts: "${unknownWords.join(
              '", "'
            )}" in "${compound}"`;

      const diagnostic = new vscode.Diagnostic(
        range,
        message,
        vscode.DiagnosticSeverity.Warning
      );

      diagnostic.data = {
        compound,
        unknownWords,
      };

      return diagnostic;
    }

    return null;
  }
}

function activate(context) {
  console.log("Spell Checker Plugin is now active!");

  const dictionaryManager = new DictionaryManager(__dirname);
  const spellChecker = new SpellChecker(dictionaryManager);

  // 初始加载
  dictionaryManager.loadAllDictionaries();

  // 注册命令和事件监听
  registerCommands(context, dictionaryManager, spellChecker);
  registerEventListeners(context, dictionaryManager, spellChecker);
}

function registerCommands(context, dictionaryManager, spellChecker) {
  const reloadDictionaryCommand = vscode.commands.registerCommand(
    "spellChecker.reloadDictionary",
    () => {
      dictionaryManager.loadAllDictionaries();
      vscode.window.showInformationMessage(
        "Dictionaries reloaded successfully."
      );
    }
  );
  const addToUserDictionaryCommand = vscode.commands.registerCommand(
    "spellChecker.addToUserDictionary",
    async (wordToAdd) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      if (!wordToAdd) {
        if (!editor.selection.isEmpty) {
          wordToAdd = editor.document.getText(editor.selection);
        } else {
          const cursorPosition = editor.selection.active;
          const range = editor.document.getWordRangeAtPosition(cursorPosition);
          if (range) {
            wordToAdd = editor.document.getText(range);
          }
        }
      }

      if (!wordToAdd) {
        vscode.window.showErrorMessage(
          "No word selected or cursor not on a word."
        );
        return;
      }

      wordToAdd = wordToAdd.trim().toLowerCase();

      if (await dictionaryManager.addToUserDictionary(wordToAdd)) {
        // vscode.window.showInformationMessage(
        //   `Added "${wordToAdd}" to user dictionary.`
        // );

        spellChecker.checkDocument(editor.document);
      } else {
        vscode.window.showInformationMessage(
          `"${wordToAdd}" is already in the user dictionary.`
        );
      }
    }
  );

  const exportUserDictionaryCommand = vscode.commands.registerCommand(
    "spellChecker.exportUserDictionary",
    async () => {
      const saveUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file("userDictionary.txt"),
        filters: {
          "Text files": ["txt"],
          "All files": ["*"],
        },
      });

      if (saveUri) {
        try {
          const content = Array.from(dictionaryManager.userDictionary).join(
            "\n"
          );
          fs.writeFileSync(saveUri.fsPath, content, "utf8");
          vscode.window.showInformationMessage(
            `User dictionary exported successfully to ${saveUri.fsPath}`
          );
        } catch (error) {
          vscode.window.showErrorMessage(
            `Failed to export dictionary: ${error.message}`
          );
        }
      }
    }
  );

  context.subscriptions.push(reloadDictionaryCommand);
  context.subscriptions.push(addToUserDictionaryCommand);
  context.subscriptions.push(exportUserDictionaryCommand);
}

function registerEventListeners(context, dictionaryManager, spellChecker) {
  vscode.workspace.textDocuments.forEach((document) => {
    spellChecker.checkDocument(document);
  });

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) =>
      spellChecker.checkDocument(event.document)
    )
  );

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) =>
      spellChecker.checkDocument(document)
    )
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("miniSpellChecker")) {
        vscode.workspace.textDocuments.forEach((document) => {
          spellChecker.checkDocument(document);
        });
      }
    })
  );

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      ["plaintext", "markdown", "javascript", "typescript"],
      {
        provideCodeActions(document, range, context) {
          const diagnostics = context.diagnostics || [];
          const actions = [];

          for (const diagnostic of diagnostics) {
            if (!diagnostic.range) continue;

            const word = document.getText(diagnostic.range);

            actions.push(
              new vscode.CodeAction(
                `Add "${word}" to dictionary`,
                vscode.CodeActionKind.QuickFix
              )
            );
            actions[actions.length - 1].command = {
              command: "spellChecker.addToUserDictionary",
              title: `Add "${word}" to dictionary`,
              arguments: [word],
            };

            const parts = splitCompoundWord(word);
            if (parts.length > 1) {
              parts.forEach((part) => {
                if (
                  !dictionaryManager.dictionary.has(part.toLowerCase()) &&
                  !dictionaryManager.userDictionary.has(part.toLowerCase())
                ) {
                  const action = new vscode.CodeAction(
                    `Add part "${part}" to dictionary`,
                    vscode.CodeActionKind.QuickFix
                  );
                  action.command = {
                    command: "spellChecker.addToUserDictionary",
                    title: `Add "${part}" to dictionary`,
                    arguments: [part],
                  };
                  actions.push(action);
                }
              });
            }
          }

          return actions;
        },
      }
    )
  );
}

function splitCompoundWord(word) {
  if (word.includes("-") || word.includes("_")) {
    return word.split(/[-_]/).filter((w) => w.length > 0);
  }

  return word
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase()
    .split(" ")
    .filter((w) => w.length > 0);
}

function deactivate() {
  console.log("Spell Checker Plugin is now deactivated.");
}

module.exports = {
  activate,
  deactivate,
};
