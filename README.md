# README Tree Generator

A Visual Studio Code extension that generates ASCII or Markdown representation of your project's folder structure for inclusion in README files.

## Features

- Generate a tree view of your project's folder structure
- Choose between ASCII or Markdown output format
- Easily insert the generated tree into your README file
- Customize which files/folders to include or exclude
- Copy tree to clipboard or insert directly into current document

## Usage

1. Open the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "Generate README Tree" and select the command
3. Choose your preferred output format (ASCII or Markdown)
4. The tree structure will be generated and copied to your clipboard or inserted at cursor position

## Examples

### ASCII Tree Output
```
project/
├── src/
│   ├── components/
│   │   ├── Button.js
│   │   └── Input.js
│   └── utils/
│       └── helpers.js
├── tests/
│   └── app.test.js
└── README.md
```

### Markdown Tree Output
```
- project/
  - src/
    - components/
      - Button.js
      - Input.js
    - utils/
      - helpers.js
  - tests/
    - app.test.js
  - README.md
```

## Extension Settings

This extension contributes the following settings:

* `readmeTreeGenerator.format`: Default output format (`ascii` or `markdown`)
* `readmeTreeGenerator.excludePatterns`: Glob patterns for files/folders to exclude (e.g., `node_modules`, `.git`)
* `readmeTreeGenerator.maxDepth`: Maximum folder depth to display (-1 for unlimited)

## Release Notes

### 1.0.0

Initial release of README Tree Generator with basic ASCII and Markdown tree generation.

### 1.0.1

Fixed issue with handling special characters in file paths.

### 1.1.0

Added settings for customizing excluded files and maximum depth.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
