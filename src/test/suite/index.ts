import * as path from 'path';
import * as Mocha from 'mocha';
import { globSync } from 'glob';

export function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'bdd',
		color: true,
		timeout: 100000,
		reporter: 'mocha-jenkins-reporter'
	});

	const testsRoot = path.resolve(__dirname);

	return new Promise((c, e) => {
		const files = globSync('**/*.test.js', { cwd: testsRoot });
		files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));
		try {
			mocha.run(failures => {
				if (failures > 0) {
					e(new Error(`${failures} tests failed.`));
				} else {
					c();
				}
			});
		} catch (err) {
			e(err);
		}
	});
}
