'use strict';

const LSP_SERVER_VERSION = "1.26.0-SNAPSHOT";

const download = require("mvn-artifact-download").default;
const fs = require('fs');
const path = require('path');

const MAVEN_REPO_URL = 'https://oss.sonatype.org/content/repositories/snapshots/';

download('com.github.camel-tooling:camel-lsp-server:' + LSP_SERVER_VERSION,
	'./jars/', MAVEN_REPO_URL).then((filename)=>{
	fs.renameSync(filename, path.join('.', 'jars', 'language-server.jar'));
});

download('com.github.camel-tooling:camel-lsp-server:json:cyclonedx:' + LSP_SERVER_VERSION, '.', MAVEN_REPO_URL).then((filename)=>{
	fs.renameSync(filename, path.join('.', 'camel-ls-sbom.json'));
});
