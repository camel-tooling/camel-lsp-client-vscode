'use strict';

const LSP_SERVER_VERSION = "1.12.0-SNAPSHOT";

const download = require("mvn-artifact-download").default;
const fs = require('fs');
const path = require('path');

download('com.github.camel-tooling:camel-lsp-server:' + LSP_SERVER_VERSION, './jars/', 'https://oss.sonatype.org/content/repositories/snapshots/').then((filename)=>{
	fs.renameSync(filename, path.join('.', 'jars', 'language-server.jar'));
});
