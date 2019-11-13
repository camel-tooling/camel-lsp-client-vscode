import { runTests } from 'vscode-test'
import * as path from 'path'

async function runTest() {
	try {
		const extensionDevelopmentPath = path.resolve(__dirname, '../../../');
		const extensionTestsPath = path.resolve(__dirname, './');
		const testWorkspace = path.resolve(__dirname, '../../../testFixture');

		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [testWorkspace]
		})
	} catch (err) {
		console.error('Failed to run tests!')
		process.exit(1)
	}
}

runTest();
