# AWS CloudFormation Guard - VS Code Extension

Language support for AWS CloudFormation Guard DSL, providing syntax highlighting, IntelliSense, diagnostics, and formatting capabilities.

> **Note:** This extension was built using AI agent to demonstrate rapid VS Code extension development with the Language Server Protocol.

## Features

### ✅ Syntax Highlighting
- Keywords: `rule`, `let`, `when`, `some`, `this`, `or`, `not`
- Operators: `==`, `!=`, `>`, `<`, `>=`, `<=`, `IN`, `exists`, `empty`, type checks
- 16 built-in functions with proper highlighting
- Variables (`%variable_name`)
- Comments (`#`)
- Custom error messages (`<< >>`)

### ✅ IntelliSense & Code Completion
- Keyword completion
- Function completion with snippets
- Operator suggestions
- Variable references

### ✅ Diagnostics
- Syntax error detection
- Undefined variable warnings
- Real-time validation

### ✅ Hover Information
- Function signatures and descriptions
- Keyword explanations
- Operator documentation

### ✅ Code Formatting
- Auto-indentation
- Consistent spacing
- Brace alignment

## Installation

### From VSIX
1. Download the `.vsix` file from releases
2. Open VS Code
3. Go to Extensions view
4. Click `...` → "Install from VSIX"
5. Select the downloaded file

### From Source
```bash
cd vscode-extension
npm install
npm run compile
```

Then press `F5` to launch the Extension Development Host.

## Usage

1. Create a `.guard` file
2. Start writing Guard rules - IntelliSense will activate automatically
3. Use `Ctrl+Space` for completion suggestions
4. Hover over keywords/functions for documentation

### Example Guard Rule

```guard
let s3_buckets = Resources.*[ Type == 'AWS::S3::Bucket' ]

rule s3_bucket_encrypted when %s3_buckets !empty {
    %s3_buckets.Properties.BucketEncryption exists
    %s3_buckets.Properties.BucketEncryption.ServerSideEncryptionConfiguration[*] {
        ServerSideEncryptionByDefault.SSEAlgorithm IN ["aws:kms", "AES256"]
    }
    <<
        Violation: S3 buckets must have encryption enabled
        Fix: Enable server-side encryption on the bucket
    >>
}
```

## Guard DSL Reference

### Keywords
- `rule` - Define a named rule
- `let` - Variable assignment  
- `when` - Conditional execution
- `some` - At-least-one quantifier
- `this` - Current context reference
- `or` - Disjunction operator
- `not` - Negation

### Operators
**Binary:** `==`, `!=`, `>`, `<`, `>=`, `<=`, `IN`  
**Unary:** `exists`, `empty`, `is_string`, `is_list`, `is_struct`, `is_bool`, `is_int`, `is_float`, `is_null`

### Built-in Functions (16 total)
- String: `json_parse`, `regex_replace`, `join`, `to_lower`, `to_upper`, `substring`, `url_decode`
- Collection: `count`, `keys`
- Converters: `parse_int`, `parse_float`, `parse_string`, `parse_boolean`, `parse_char`
- Date/Time: `parse_epoch`, `now`

**Note:** Functions must be used with variable assignment: `let result = count(Resources.*)`

## Development

### Build
```bash
npm run compile
```

### Watch Mode
```bash
npm run watch
```

### Debug
1. Open the extension folder in VS Code
2. Press `F5` to launch Extension Development Host
3. Open a `.guard` file to test

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## Links

- [CloudFormation Guard Repository](https://github.com/aws-cloudformation/cloudformation-guard)
- [Guard Documentation](../docs/)
- [VS Code Extension API](https://code.visualstudio.com/api)

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
