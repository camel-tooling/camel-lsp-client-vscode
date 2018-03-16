'use strict';
const fs = require('fs');
const download = require('download')
var url = "https://github.com/camel-idea-plugin/camel-language-server/releases/download/untagged-691265464c773b7827f9/camel-lsp-server-1.0.0-SNAPSHOT.jar"

download(url).then(data => {
    fs.writeFileSync('./jars/language-server.jar', data);
});
