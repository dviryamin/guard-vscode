import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	Hover,
	MarkupKind,
	Position,
	Range,
	DocumentFormattingParams,
	TextEdit
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

// Create connection and document manager
const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			completionProvider: {
				resolveProvider: true,
				triggerCharacters: ['%', '.', '[']
			},
			hoverProvider: true,
			documentFormattingProvider: true
		}
	};
	
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

// Guard DSL configuration
interface GuardSettings {
	maxNumberOfProblems: number;
	formattingEnabled: boolean;
	indentSize: number;
}

const defaultSettings: GuardSettings = { 
	maxNumberOfProblems: 100,
	formattingEnabled: true,
	indentSize: 4
};
let globalSettings: GuardSettings = defaultSettings;
const documentSettings: Map<string, Thenable<GuardSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		documentSettings.clear();
	} else {
		globalSettings = (change.settings.guard || defaultSettings);
	}
	documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<GuardSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'guard'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});

documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
});

// Validation
async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	const settings = await getDocumentSettings(textDocument.uri);
	const text = textDocument.getText();
	const diagnostics: Diagnostic[] = [];

	// Simple validation rules
	const lines = text.split('\n');
	
	for (let i = 0; i < lines.length && diagnostics.length < settings.maxNumberOfProblems; i++) {
		const line = lines[i];
		
		// Check for unterminated strings
		const stringMatch = line.match(/^[^#]*"[^"]*$/);
		if (stringMatch) {
			diagnostics.push({
				severity: DiagnosticSeverity.Error,
				range: {
					start: { line: i, character: 0 },
					end: { line: i, character: line.length }
				},
				message: 'Unterminated string',
				source: 'guard'
			});
		}
		
		// Check for undefined variables (simple check)
		const varUsage = line.matchAll(/%([a-zA-Z_][a-zA-Z0-9_]*)/g);
		for (const match of varUsage) {
			const varName = match[1];
			// Check if variable is defined before use (simple check)
			const textBefore = text.substring(0, textDocument.offsetAt({ line: i, character: 0 }));
			if (!textBefore.includes(`let ${varName}`)) {
				diagnostics.push({
					severity: DiagnosticSeverity.Warning,
					range: {
						start: { line: i, character: match.index! },
						end: { line: i, character: match.index! + match[0].length }
					},
					message: `Variable '${varName}' may not be defined`,
					source: 'guard'
				});
			}
		}
	}

	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

// Completion
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		const items: CompletionItem[] = [];
		
		// Keywords
		const keywords = ['rule', 'let', 'when', 'some', 'this', 'or', 'not'];
		keywords.forEach((kw, i) => {
			items.push({
				label: kw,
				kind: CompletionItemKind.Keyword,
				data: i
			});
		});
		
		// Operators
		const operators = ['exists', 'empty', 'keys', 'is_string', 'is_list', 'is_struct', 'is_bool', 'is_int', 'is_float', 'is_null', 'IN'];
		operators.forEach((op, i) => {
			items.push({
				label: op,
				kind: CompletionItemKind.Operator,
				data: keywords.length + i
			});
		});
		
		// Functions
		const functions = [
			'json_parse', 'regex_replace', 'join', 'to_lower', 'to_upper',
			'substring', 'url_decode', 'count', 'parse_int',
			'parse_float', 'parse_string', 'parse_boolean', 'parse_char',
			'parse_epoch', 'now'
		];
		functions.forEach((fn, i) => {
			items.push({
				label: fn,
				kind: CompletionItemKind.Function,
				data: keywords.length + operators.length + i,
				insertText: `${fn}($0)`,
				insertTextFormat: 2 // Snippet
			});
		});
		
		return items;
	}
);

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
	// Add documentation for functions
	const functionDocs: Record<string, string> = {
		'count': 'Count items in a collection\n\nUsage: `let c = count(Resources.*)`',
		'json_parse': 'Parse JSON string into object\n\nUsage: `let obj = json_parse(%json_string)`',
		'regex_replace': 'Replace regex pattern\n\nUsage: `let result = regex_replace(%string, %pattern, %replacement)`',
		'join': 'Join collection with delimiter\n\nUsage: `let str = join(%collection, ",")`',
		'to_lower': 'Convert to lowercase\n\nUsage: `let lower = to_lower(%string)`',
		'to_upper': 'Convert to uppercase\n\nUsage: `let upper = to_upper(%string)`',
		'substring': 'Extract substring\n\nUsage: `let sub = substring(%string, 0, 10)`',
		'url_decode': 'URL decode string\n\nUsage: `let decoded = url_decode(%encoded)`',
		'parse_int': 'Convert to integer\n\nUsage: `let num = parse_int(%value)`',
		'parse_float': 'Convert to float\n\nUsage: `let num = parse_float(%value)`',
		'parse_string': 'Convert to string\n\nUsage: `let str = parse_string(%value)`',
		'parse_boolean': 'Convert to boolean\n\nUsage: `let bool = parse_boolean(%value)`',
		'parse_char': 'Convert to character\n\nUsage: `let c = parse_char(%value)`',
		'parse_epoch': 'Parse RFC3339 datetime to epoch\n\nUsage: `let ts = parse_epoch(%datetime)`',
		'now': 'Get current epoch timestamp\n\nUsage: `let ts = now()`'
	};
	
	if (item.label in functionDocs) {
		item.detail = 'Guard built-in function';
		item.documentation = functionDocs[item.label];
	}
	
	return item;
});

// Hover
connection.onHover((params: TextDocumentPositionParams): Hover | undefined => {
	const document = documents.get(params.textDocument.uri);
	if (!document) {
		return undefined;
	}
	
	const text = document.getText();
	const offset = document.offsetAt(params.position);
	
	// Simple word extraction
	const wordRange = getWordRangeAtPosition(text, offset);
	if (!wordRange) {
		return undefined;
	}
	
	const word = text.substring(wordRange.start, wordRange.end);
	
	// Provide hover for keywords and functions
	const hoverTexts: Record<string, string> = {
		'rule': '**rule** - Define a named rule\n\nSyntax: `rule rule_name when condition { ... }`',
		'let': '**let** - Variable assignment\n\nSyntax: `let variable_name = value`',
		'when': '**when** - Conditional execution\n\nSyntax: `when condition { ... }`',
		'exists': '**exists** - Check if property exists\n\nUsage: `Properties.BucketName exists`',
		'empty': '**empty** - Check if collection is empty\n\nUsage: `Resources !empty`',
		'keys': '**keys** - Filter by map keys in queries\n\nUsage: `this[ keys == /pattern/ ]` or `Condition[ keys == /String(Equals|Like)/ ]`',
		'count': '**count()** - Count items in collection\n\nReturns the number of items. Must be used in variable assignment.'
	};
	
	if (word in hoverTexts) {
		return {
			contents: {
				kind: MarkupKind.Markdown,
				value: hoverTexts[word]
			}
		};
	}
	
	return undefined;
});

// Formatting
connection.onDocumentFormatting((params: DocumentFormattingParams): TextEdit[] => {
	const document = documents.get(params.textDocument.uri);
	if (!document) {
		return [];
	}
	
	const text = document.getText();
	const lines = text.split('\n');
	const formatted: string[] = [];
	let indent = 0;
	const indentStr = ' '.repeat(params.options.tabSize || 4);
	
	for (const line of lines) {
		let trimmed = line.trim();
		
		// Skip empty lines
		if (trimmed === '') {
			formatted.push('');
			continue;
		}
		
		// Normalize spacing after commas (only one space)
		trimmed = trimmed.replace(/,\s+/g, ', ');
		
		// Count opening and closing braces/brackets
		const openBraces = (trimmed.match(/\{/g) || []).length;
		const closeBraces = (trimmed.match(/\}/g) || []).length;
		const openBrackets = (trimmed.match(/\[/g) || []).length;
		const closeBrackets = (trimmed.match(/\]/g) || []).length;
		
		const netChange = (openBraces - closeBraces) + (openBrackets - closeBrackets);
		
		// Decrease indent for lines that close more than they open
		if (netChange < 0) {
			indent = Math.max(0, indent + netChange);
		}
		
		// Add indented line
		formatted.push(indentStr.repeat(indent) + trimmed);
		
		// Increase indent for lines that open more than they close
		if (netChange > 0) {
			indent += netChange;
		}
	}
	
	const fullRange = Range.create(
		Position.create(0, 0),
		document.positionAt(text.length)
	);
	
	return [
		TextEdit.replace(fullRange, formatted.join('\n'))
	];
});

// Helper functions
function getWordRangeAtPosition(text: string, offset: number): { start: number; end: number } | undefined {
	let start = offset;
	let end = offset;
	
	// Find start
	while (start > 0 && /[a-zA-Z0-9_]/.test(text[start - 1])) {
		start--;
	}
	
	// Find end
	while (end < text.length && /[a-zA-Z0-9_]/.test(text[end])) {
		end++;
	}
	
	if (start === end) {
		return undefined;
	}
	
	return { start, end };
}

// Listen to documents and connection
documents.listen(connection);
connection.listen();
