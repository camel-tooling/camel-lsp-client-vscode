import { downloadAndUnzipVSCode, resolveCliPathFromVSCodeExecutablePath, runTests } from 'vscode-test'
import * as cp from 'child_process';
import * as path from 'path'

async function runTest() {
	try {
		const extensionDevelopmentPath = path.resolve(__dirname, '../../../');
		const extensionTestsPath = path.resolve(__dirname, './');
		const testWorkspace = path.resolve(__dirname, '../../../test Fixture with speci@l chars');

		const vscodeExecutablePath : string = await downloadAndUnzipVSCode('stable');
		console.log(`vscodeExecutablePath = ${vscodeExecutablePath}`);

		const cliPath: string = resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath);
		cp.spawnSync(cliPath, ['--install-extension', 'redhat.vscode-quarkus', '--force'],
		{
			encoding: 'utf-8',
			stdio: 'inherit'
		});

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
