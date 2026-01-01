import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
	// Server module is the compiled server code
	const serverModule = context.asAbsolutePath(
		path.join('out', 'server.js')
	);
	
	// Debug options for the server
	const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// Server options
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	// Client options
	const clientOptions: LanguageClientOptions = {
		// Register the server for Guard documents
		documentSelector: [{ scheme: 'file', language: 'guard' }],
		synchronize: {
			// Notify the server about file changes to '.guard' files in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/*.guard')
		}
	};

	// Create the language client and start it
	client = new LanguageClient(
		'guardLanguageServer',
		'Guard Language Server',
		serverOptions,
		clientOptions
	);

	// Start the client (this will also launch the server)
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
