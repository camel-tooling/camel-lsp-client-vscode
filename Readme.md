[![GitHub tag](https://img.shields.io/github/tag/camel-tooling/camel-lsp-client-vscode.svg?style=plastic)]()
[![Build Status](https://travis-ci.org/camel-tooling/camel-lsp-client-vscode.svg?branch=master)](https://travis-ci.org/camel-tooling/camel-lsp-client-vscode)
[![License](https://img.shields.io/badge/license-Apache%202-blue.svg)]()
[![Gitter](https://img.shields.io/gitter/room/camel-tooling/Lobby.js.svg)](https://gitter.im/camel-tooling/Lobby)

# Apache Camel for Visual Studio Code
This is a preview release of the [Visual Studio Code](https://code.visualstudio.com/) extension that adds [Apache Camel](http://camel.apache.org/) language support for XML DSL and Java DSL code.
  
When you add this extension to your installation of VS Code, the VS Code editor provides the following features:

For both XML DSL and Java:
* Language service support for Apache Camel URIs:
  * Auto-completion for Camel components, attributes, and the list of attribute values.
  * Quick reference documentation when you hover the cursor over a Camel component.
* Navigation to Camel routes.
* Diagnostics for Camel URIs when you save a file.

For XML DSL only:
* Auto-completion for referenced IDs of `direct`, `direct-vm`, `vm` and `seda` components.
* Find references for `direct` and `direct-vm` components in all open Camel files.
* Add the navigation symbol for Camel context and routes (used for VS Code editor navigation and outline functionality)

For animated GIFs that demonstrate some of these features, see the [wiki page](https://github.com/camel-tooling/camel-lsp-client-vscode/wiki/Apache-Camel-for-Visual-Studio-Code-wiki).

For detailed information about Apache Camel supported features, see the [Language Server GitHub page](https://github.com/camel-tooling/camel-language-server#features).

## Contact Us
If you run into an issue or have a suggestion, you can contact us by [creating a new issue on GitHub](https://github.com/camel-tooling/camel-lsp-client-vscode/issues).

## How to install
You can download this Camel LSP Extension from the Visual Studio Code Marketplace at https://marketplace.visualstudio.com/items?itemName=camel-tooling.vscode-apache-camel.

After you install VS Code, follow these steps:
1. In VS Code, select **View > Extensions**.
2. Search for **Camel**.
3. Select the **Language Support for Apache Camel** option and then click *Install*.

## Prerequisites for using this extension

After you install the Language Support for Apache Camel extension, you can access its features as follows:
 
For XML DSL:
* You use an `.xml` file extension.
* You specify the Camel namespace http://camel.apache.org/schema/blueprint or http://camel.apache.org/schema/spring for the Camel element.

For Java DSL:
* You use a `.java` file extension. 
* You specify Camel (usually from an imported package) with `from` or `to` and a string without a space. The string cannot be a variable. For example, `from("xxx")` works but `from( "xxx")` and `from(aVariable)` do not work.

