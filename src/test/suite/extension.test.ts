import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Extension Compatibility Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('VS Code version compatibility', () => {
		// Get the current VS Code version
		const vscodeVersion = vscode.version;
		console.log(`Running on VS Code version: ${vscodeVersion}`);

		// Read the minimum required version from package.json
		const extensionPath = vscode.extensions.getExtension('dviryamin.guard-vscode')?.extensionPath;
		assert.ok(extensionPath, 'Extension path should be available');

		const packageJson = require(path.join(extensionPath!, 'package.json'));
		const requiredVersion = packageJson.engines.vscode.replace('^', '');

		console.log(`Required minimum VS Code version: ${requiredVersion}`);

		// Parse versions for comparison
		const parseVersion = (version: string) => {
			const parts = version.split('.');
			return {
				major: parseInt(parts[0]),
				minor: parseInt(parts[1]),
				patch: parseInt(parts[2] || '0')
			};
		};

		const current = parseVersion(vscodeVersion);
		const required = parseVersion(requiredVersion);

		// Check if current version meets minimum requirement
		const isCompatible =
			current.major > required.major ||
			(current.major === required.major && current.minor > required.minor) ||
			(current.major === required.major && current.minor === required.minor && current.patch >= required.patch);

		assert.ok(
			isCompatible,
			`VS Code version ${vscodeVersion} should be >= required version ${requiredVersion}`
		);
	});

	test('Extension should be present', () => {
		const extension = vscode.extensions.getExtension('dviryamin.guard-vscode');
		assert.ok(extension, 'Extension should be installed');
	});

	test('Extension should activate', async function() {
		this.timeout(10000); // Allow time for activation

		const extension = vscode.extensions.getExtension('dviryamin.guard-vscode');
		assert.ok(extension, 'Extension should be installed');

		if (!extension!.isActive) {
			await extension!.activate();
		}

		assert.ok(extension!.isActive, 'Extension should be activated');
	});

	test('Extension should register Guard language', async () => {
		const languages = await vscode.languages.getLanguages();
		assert.ok(
			languages.includes('guard'),
			'Guard language should be registered'
		);
	});

	test('Extension should handle .guard files', async function() {
		this.timeout(10000);

		// Create a temporary guard file
		const testContent = 'let test_var = "value"\nrule test_rule {\n    test_var == "value"\n}';
		const doc = await vscode.workspace.openTextDocument({
			content: testContent,
			language: 'guard'
		});

		assert.strictEqual(doc.languageId, 'guard', 'Document should have guard language ID');
		
		// Open the document in an editor
		await vscode.window.showTextDocument(doc);
		
		// Clean up
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	});
});
