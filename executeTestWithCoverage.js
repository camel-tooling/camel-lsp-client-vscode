#!/usr/bin/node
const { resolve, join } = require('path');
const { writeFileSync } = require('fs-extra');
const execa = require('execa');
let activationEvents = [];
let failed;
const packageJsonPath = resolve(__dirname, 'package.json');
const cwd = join(__dirname);
const pipe = childProcess => {
  childProcess.stdout.pipe(process.stdout);
  childProcess.stderr.pipe(process.stderr);
};
const packageJson = require(packageJsonPath);
activationEvents = packageJson.activationEvents;
packageJson.activationEvents = ['onStartupFinished'];
writeFileSync(packageJsonPath, JSON.stringify(packageJson));
const tsc = execa('tsc', ['-p', './'], {
  cwd
});
pipe(tsc);
tsc.then(() => {
  const tests = execa('node', [join(cwd, 'out', 'src', 'test', 'runTest.js')], {
    cwd
  });
  pipe(tests);
  tests
    .then(() => {})
    .catch(() => {
      failed = true;
    })
    .finally(() => {
      packageJson.activationEvents = activationEvents;
      writeFileSync(packageJsonPath, JSON.stringify(packageJson));
      const prettier = execa('prettier', ['--write', 'package.json'], { cwd });
      pipe(prettier);
      prettier.then(() => {
        if (failed) {
          process.exit(1);
        }
      })
    });
});
