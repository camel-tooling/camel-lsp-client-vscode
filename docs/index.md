## Introduction

Welcome to the `VS Code extension Language Support for Apache Camel` project created by Red Hat! Here you'll find a description of how to use VS Code extension providing Language Support for Apache Camel.

## Description

This extension provides completion, validation and documentation features for Apache Camel URI elements directly in your Visual Studio Code editor. It is working as a client using the [Microsoft Language Server Protocol](https://microsoft.github.io/language-server-protocol/) which communicates with [Camel Language Server](https://github.com/camel-tooling/camel-language-server) providing all functionalities.

## How to install

1. You can download this **Language Support for Apache Camel** extension from the [VS Code Extension Marketplace](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-apache-camel) and the [Open VSX Registry](https://open-vsx.org/extension/redhat/vscode-apache-camel).
2. Language Support for Apache Camel can be also installed directly in the [Microsoft VS Code](https://code.visualstudio.com/).

    **Steps**
    - Open your VS Code.
    - In VS Code, select **View > Extensions**.
    - In the search bar, type `Camel`
    - Select the **Language Support for Apache Camel** option and then click `Install`.

## Features

- [Language service support for Apache Camel URIs](./content/camel-uris.md)
- [Diagnostics for Camel URIs](./content/diagnostics.md)
- [Code Navigation](./content/navigation.md)
- [Camel K modelines support](./content/camelk.md)
- [Specific Camel Catalog Version](./content/other.md#specific-camel-catalog)
- [Specific Runtime provider for the Camel Catalog](./content/other.md#specific-runtime-provider)
- [Provide Additional Camel components](./content/other.md#additional-camel-components)
- [Quick Reference Documentation](./content/other.md#quick-reference-documentation)
- [Create a Camel Route using Camel JBang](./content/commands.md)
  - Yaml DSL
  - Java DSL
  - XML DSL
- [Deprecated] [Camel Kafka Connector support](./content/kafka.md)
- [XML DSL Only](./content/xml-dsl-only.md)
  - Auto-completion for referenced IDs of `direct`, `direct VM`, `VM` and `SEDA` components
  - Find references for `direct` and `direct VM` components
