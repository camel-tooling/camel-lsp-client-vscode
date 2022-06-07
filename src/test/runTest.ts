import { downloadAndUnzipVSCode, resolveCliArgsFromVSCodeExecutablePath, runTests } from '@vscode/test-electron'
import * as cp from 'child_process';
import * as path from 'path'

async function runTest() {
	try {
		const extensionDevelopmentPath = path.resolve(__dirname, '../../../');
		const extensionTestsPath = path.resolve(__dirname, './');
		const testWorkspace = path.resolve(__dirname, '../../../test Fixture with speci@l chars');

		const vscodeVersion = computeVSCodeVersionToPlayTestWith();

		const vscodeExecutablePath : string = await downloadAndUnzipVSCode(vscodeVersion);
		console.log(`vscodeExecutablePath = ${vscodeExecutablePath}`);

		const [cliPath, ...args] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);
		cp.spawnSync(cliPath, [...args, '--install-extension', 'redhat.vscode-quarkus', '--force'],
		{
			encoding: 'utf-8',
			stdio: 'inherit'
		});

		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [testWorkspace, '--disable-workspace-trust']
		})
	} catch (err) {
		console.error('Failed to run tests!')
		process.exit(1)
	}

	function computeVSCodeVersionToPlayTestWith() {
		const envVersion = process.env.CODE_VERSION;
		if (envVersion) {
			return envVersion;
		}
		return 'stable';
	}
}

runTest();
