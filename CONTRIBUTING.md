# Contributing to AWS CloudFormation Guard VS Code Extension

Thank you for your interest in contributing to this project! This guide will help you get started.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Code Style](#code-style)
- [Language Server Protocol](#language-server-protocol)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- VS Code (v1.75.0 or higher)
- TypeScript knowledge
- Familiarity with Language Server Protocol (LSP) is helpful

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/dviryamin/guard-vscode.git
   cd guard-vscode
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Extension**
   ```bash
   npm run compile
   ```

4. **Run in Development Mode**
   - Open the project in VS Code
   - Press `F5` to launch the Extension Development Host
   - Open a `.guard` file to test your changes

5. **Watch Mode** (for continuous compilation)
   ```bash
   npm run watch
   ```

## Project Structure

```
guard-vscode-extension/
├── src/
│   ├── extension.ts          # Extension activation & client setup
│   └── server.ts             # Language server implementation
├── syntaxes/
│   └── guard.tmLanguage.json # TextMate grammar for syntax highlighting
├── icons/                    # Extension icons
├── package.json              # Extension manifest & dependencies
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Documentation
```

### Key Files

- **extension.ts**: Activates the extension and starts the language client
- **server.ts**: Implements LSP features (completion, diagnostics, hover, formatting)
- **guard.tmLanguage.json**: Defines syntax highlighting rules
- **package.json**: Extension metadata, activation events, and contributions

## Making Changes

### Adding New Features

1. **For Language Features** (completion, hover, diagnostics, etc.)
   - Modify `src/server.ts`
   - Implement using LSP handlers (e.g., `connection.onCompletion`)

2. **For Syntax Highlighting**
   - Edit `syntaxes/guard.tmLanguage.json`
   - Follow TextMate grammar conventions

3. **For Extension Configuration**
   - Update `contributes` section in `package.json`
   - Add configuration schema if needed

### Example: Adding a New Completion Item

```typescript
// In src/server.ts, within connection.onCompletion():
items.push({
    label: 'new_keyword',
    kind: CompletionItemKind.Keyword,
    detail: 'Description',
    documentation: 'Detailed documentation'
});
```

### Example: Adding Hover Documentation

```typescript
// In src/server.ts, within connection.onHover():
const hoverTexts: Record<string, string> = {
    'keyword': '**keyword** - Description\n\nUsage: `example`'
};
```

## Testing

### Manual Testing

1. Press `F5` to launch Extension Development Host
2. Create or open a `.guard` file
3. Test your changes:
   - Type to trigger completions (`Ctrl+Space`)
   - Hover over keywords/functions
   - Check diagnostics in Problems panel
   - Format document (`Shift+Alt+F`)

### Test Cases to Cover

- ✅ Syntax highlighting for new keywords
- ✅ Completion suggestions appear correctly
- ✅ Hover information is accurate
- ✅ Diagnostics detect errors
- ✅ Formatting preserves code structure
- ✅ Variable autocompletion works with `%` prefix

### Creating Test Files

Add test cases in `test-sample.guard`:

```guard
# Test case for your feature
let test_var = "value"
rule test_rule when %test_var exists {
    # Your test code
}
```

## Submitting Changes

### Before Submitting

1. **Compile without errors**
   ```bash
   npm run compile
   ```

2. **Run linter**
   ```bash
   npm run lint
   ```

3. **Test thoroughly** in Extension Development Host

4. **Update documentation** if adding features

### Pull Request Process

1. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes with clear commit messages
   ```bash
   git commit -m "feat: add new completion for X keyword"
   ```

3. Push to your fork
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a Pull Request with:
   - Clear description of changes
   - Screenshots/GIFs if UI-related
   - Reference any related issues

### Commit Message Format

All commit messages must follow the Conventional Commits specification to ensure consistency and enable automated changelog generation.

#### Format

```
<type>: <subject>

[optional body]

[optional footer(s)]
```

#### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, whitespace)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Changes to build system or dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files

#### Rules

- Use the imperative mood in the subject line ("Add feature" not "Added feature")
- Don't capitalize the first letter of the subject
- No period at the end of the subject line
- Subject line should be 50 characters or less
- Body should wrap at 72 characters
- Separate subject from body with a blank line
- Use the body to explain *what* and *why* vs. *how*

#### Examples

**Simple commit:**
```
feat: add variable autocompletion with % prefix filtering
```

**With body:**
```
fix: completion not triggering after % character

The completion handler was not detecting when the user typed '%' followed
by characters. Updated the regex pattern and filterText logic to properly
handle variable context.
```

**With breaking change:**
```
feat: change configuration structure

BREAKING CHANGE: Configuration keys have been renamed to follow
guard.* namespace. Update your settings.json accordingly.
```

**With issue reference:**
```
fix: resolve diagnostic range calculation error

Fixes #123
```

#### Commit Message Validation

All commits are automatically validated by our CI pipeline. If your commit message doesn't follow the format, the build will fail. You can validate locally before pushing:

```bash
# Install commitlint (optional, for local validation)
npm install -g @commitlint/cli @commitlint/config-conventional

# Validate last commit
echo "$(git log -1 --pretty=%B)" | commitlint
```

## Code Style

### TypeScript Conventions

- Use **TypeScript strict mode**
- Prefer `const` over `let`
- Use meaningful variable names
- Add JSDoc comments for exported functions
- Follow existing code patterns

### Example

```typescript
/**
 * Extract declared variables from Guard document
 * @param text The document text to parse
 * @returns Set of variable names
 */
function extractVariables(text: string): Set<string> {
    const variablePattern = /let\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g;
    const variables = new Set<string>();
    let match;
    
    while ((match = variablePattern.exec(text)) !== null) {
        variables.add(match[1]);
    }
    
    return variables;
}
```

### Formatting

- Indentation: 1 tab (as configured in project)
- Line length: Reasonable (aim for <120 characters)
- Trailing commas: Yes
- Semicolons: Yes

## Language Server Protocol

This extension uses LSP for language features. Key concepts:

### Client (extension.ts)
- Activates the extension
- Starts the language server in a separate process
- Handles communication via IPC

### Server (server.ts)
- Runs in isolated process
- Handles LSP requests:
  - `onInitialize`: Declare capabilities
  - `onCompletion`: Provide completions
  - `onHover`: Show hover information
  - `onDocumentFormatting`: Format document
  - Document changes: Trigger validation

### Adding New LSP Features

1. Check [LSP Specification](https://microsoft.github.io/language-server-protocol/)
2. Declare capability in `onInitialize`
3. Implement handler (e.g., `connection.onXXX`)
4. Test in Extension Development Host

## Questions?

- Check existing code for patterns
- Review [VS Code Extension API](https://code.visualstudio.com/api)
- Look at [LSP Documentation](https://microsoft.github.io/language-server-protocol/)
- Open an issue for discussion
