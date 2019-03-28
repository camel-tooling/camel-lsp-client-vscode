[![GitHub tag](https://img.shields.io/github/tag/camel-tooling/camel-lsp-client-vscode.svg?style=plastic)]()
[![Build Status](https://travis-ci.org/camel-tooling/camel-lsp-client-vscode.svg?branch=master)](https://travis-ci.org/camel-tooling/camel-lsp-client-vscode)
[![License](https://img.shields.io/badge/license-Apache%202-blue.svg)]()
[![Gitter](https://img.shields.io/gitter/room/camel-tooling/Lobby.js.svg)](https://gitter.im/camel-tooling/Lobby)

# Apache Camel for Visual Studio Code
This preview release of the extension adds language support for [Apache Camel](http://camel.apache.org/) to [Visual Studio Code](https://code.visualstudio.com/) including:
* Language service for Apache Camel URI:
  * Auto-Completion for components, attributes and attribute value list.
  * Quick Info (Hover)
* Navigation to Camel routes for XML files (Ctrl+Shift+O)
* Diagnostic for Camel URIs with XML DSL when saving file
* Find references for direct and direct-vm component (Shift + F12)

<img src="./images/completion.gif" alt="Completion for XML DSL"
	title="Completion for XML DSL" width="150" height="100" />
![Completion for Java DSL](./images/completionJava.gif "Completion for Java DSL")
![Navigation Symbol for Camel routes and Camel Context for XML DSL](./images/navigationSymbol.gif "Navigation Symbol for Camel route and Camel context for XML DSL")
![Diagnostic for XML DSL](./images/diagnostic.png "Diagnostic for XML DSL")


You can find more detailed information about Apache Camel supported features at Language Server [GitHub page](https://github.com/camel-tooling/camel-language-server#features).

## Contact Us
If you run into any issues or have suggestions, please file [issues and suggestions on GitHub](https://github.com/camel-tooling/camel-lsp-client-vscode/issues).

## How to install
The Camel LSP Extension is available from the VSCode Marketplace at https://marketplace.visualstudio.com/items?itemName=camel-tooling.vscode-apache-camel.

* Install VS Code
* Open Extensions View (Ctrl+Shift+X)
* Search for "Camel"
* Select the "Language Support for Apache Camel" entry and click Install
* Enjoy!
