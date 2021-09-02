'use strict';

var lsp_server_version = "1.3.0-SNAPSHOT";

const download = require("mvn-artifact-download").default;
const fs = require('fs');
const path = require('path');

download('com.github.camel-tooling:camel-lsp-server:' + lsp_server_version, './jars/', 'https://oss.sonatype.org/content/repositories/snapshots/').then((filename)=>{
	fs.renameSync(filename, path.join('.', 'jars', 'language-server.jar'));
});
