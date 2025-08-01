'use strict';

const LSP_SERVER_VERSION = "1.34.0-SNAPSHOT";

const download = require("mvn-artifact-download").default;
const fs = require('fs');
const path = require('path');

// Released versions: https://repo1.maven.org/maven2/
// Snapshot versions: https://central.sonatype.com/repository/maven-snapshots/
const MAVEN_REPO_URL = 'https://central.sonatype.com/repository/maven-snapshots/';

download('com.github.camel-tooling:camel-lsp-server:' + LSP_SERVER_VERSION,
	'./jars/', MAVEN_REPO_URL).then((filename)=>{
	fs.renameSync(filename, path.join('.', 'jars', 'language-server.jar'));
});

download('com.github.camel-tooling:camel-lsp-server:json:cyclonedx:' + LSP_SERVER_VERSION, '.', MAVEN_REPO_URL).then((filename)=>{
	fs.renameSync(filename, path.join('.', 'camel-ls-sbom.json'));
});
