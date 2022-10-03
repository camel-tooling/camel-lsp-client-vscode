'use strict';

var lsp_server_version = "1.7.0";

const download = require("mvn-artifact-download").default;
const fs = require('fs');
const path = require('path');

download('com.github.camel-tooling:camel-lsp-server:' + lsp_server_version, './jars/', 'https://oss.sonatype.org/content/repositories/releases/').then((filename)=>{
	fs.renameSync(filename, path.join('.', 'jars', 'language-server.jar'));
});
