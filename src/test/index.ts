'use strict';

import * as testRunner from 'vscode/lib/testrunner';

testRunner.configure({
    ui: 'bdd',
    useColors: true,
    timeout: 100000,
    reporter: 'mocha-jenkins-reporter'
});

module.exports = testRunner;