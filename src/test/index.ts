import * as path from 'path';
import * as Mocha from 'mocha';
import * as glob from 'glob';

function setupNyc() {
	const NYC = require('nyc');
	const defaultExclude = require('@istanbuljs/schema/default-exclude');
	const cwd = path.join(__dirname, '..', '..', '..');
	console.log('cwd: '+cwd);
	const nyc = new NYC({
	  cache: true,
	  cacheDir: path.join(cwd, '.cache', 'nyc'),
	  cwd,
	  exclude: [...defaultExclude, '**/.vscode-test/**'],
	  extensions: ['ts'],
	  hookRequire: true,
	  hookRunInContext: true,
	  hookRunInThisContext: true,
	  instrument: true,
	  reporter: ['text', 'html'],
	  sourceMap: true,
	  tempDirectory: path.join(cwd, 'coverage', 'integration')
	});
	nyc.reset();
	nyc.wrap();
	return nyc;
  }


export function run(): Promise<void> {
	const nyc = setupNyc()
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'bdd',
		color: true,
		timeout: 100000,
		reporter: 'mocha-jenkins-reporter'
	});

	const testsRoot = path.resolve(__dirname, '..');

	return new Promise((c, e) => {
		glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
			if (err) {
				return e(err);
			}

			// Add files to the test suite
			files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

			try {
				// Run the mocha test
				mocha.run(failures => {
					if (failures > 0) {
						e(new Error(`${failures} tests failed.`));
					} else {
						c();
					}
				});
			} catch (err) {
				e(err);
			} finally {
				if (nyc) {
					nyc.writeCoverageFile();
					nyc.report();
				}
			}
		});
	});
}
