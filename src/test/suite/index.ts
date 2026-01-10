import * as path from 'path';
import * as fs from 'fs';
import Mocha from 'mocha';

export async function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
		color: true
	});

	const testsRoot = path.resolve(__dirname, '..');

	// Recursively find all .test.js files
	const files = findTestFiles(testsRoot);
	
	// Add files to the test suite
	files.forEach((f: string) => mocha.addFile(f));

	// Run the mocha test
	return new Promise<void>((resolve, reject) => {
		try {
			mocha.run(failures => {
				if (failures > 0) {
					reject(new Error(`${failures} tests failed.`));
				} else {
					resolve();
				}
			});
		} catch (err) {
			console.error(err);
			reject(err);
		}
	});
}

function findTestFiles(dir: string): string[] {
	const files: string[] = [];
	
	function walk(directory: string) {
		const items = fs.readdirSync(directory);
		
		for (const item of items) {
			const fullPath = path.join(directory, item);
			const stat = fs.statSync(fullPath);
			
			if (stat.isDirectory()) {
				walk(fullPath);
			} else if (item.endsWith('.test.js')) {
				files.push(fullPath);
			}
		}
	}
	
	walk(dir);
	return files;
}
