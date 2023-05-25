import { downloadAndUnzipVSCode, resolveCliArgsFromVSCodeExecutablePath, runTests } from '@vscode/test-electron'
import * as cp from 'child_process';
import * as path from 'path'

async function runTest() {
	try {
		const extensionDevelopmentPath = path.resolve(__dirname, '../../../');
		console.log(`extensionDevelopmentPath = ${extensionDevelopmentPath}`);
		const extensionTestsPath = path.resolve(__dirname, './suite/index');
		console.log(`extensionTestsPath = ${extensionTestsPath}`);
		const testWorkspace = path.resolve(__dirname, '../../../test Fixture with speci@l chars');
		console.log(`testWorkspace = ${testWorkspace}`);

		const vscodeVersion = computeVSCodeVersionToPlayTestWith();
		console.log(`vscodeVersion = ${vscodeVersion}`);

		const vscodeExecutablePath: string = await downloadAndUnzipVSCode(vscodeVersion);
		console.log(`vscodeExecutablePath = ${vscodeExecutablePath}`);

		const [cliPath, ...args] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);
		cp.spawnSync(cliPath, [...args, '--install-extension', 'redhat.vscode-quarkus', '--force'],
			{
				encoding: 'utf-8',
				stdio: 'inherit'
			});

		await runTests({
			vscodeExecutablePath,
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [testWorkspace, '--disable-workspace-trust', '--user-data-dir', `${extensionDevelopmentPath}/.vscode-test`]
		})
	} catch (err) {
		console.error('Failed to run tests: ' + err);
		process.exit(1)
	}

	function computeVSCodeVersionToPlayTestWith() {
		const envVersion = process.env.CODE_VERSION;
		if (envVersion === undefined || envVersion === 'max') {
			return 'stable';
		} else if (envVersion === 'latest') {
			return 'insiders';
		}
		return envVersion;
	}

}

runTest();
