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
- [Automatic schema association for Camel YAML file](./content/other.md#automatic-schema-association-for-camel-yaml-file)
- [Create a Camel Route using Camel JBang](./content/commands.md#create-a-camel-route-using-camel-jbang)
  - YAML DSL
  - Java DSL
  - XML DSL
  - from an OpenAPI file using YAML DSL
  - Kamelet with YAML DSL
  - Custom Resource Pipe with YAML DSL
- [Transform Camel Routes from XML and Java to YAML using Camel JBang](./content/commands.md#transform-a-camel-route-to-yaml-using-camel-jbang)
- [Create a Camel Quarkus project](./content/commands.md#quarkus)
- [Create a Camel on SpringBoot project](./content/commands.md#springboot)
- [XML DSL Only](./content/xml-dsl-only.md)
  - Auto-completion for referenced IDs of `direct`, `direct VM`, `VM` and `SEDA` components
  - Find references for `direct` and `direct VM` components

## How to export with Red Hat productized version

To export a standalone Camel file to a Red Hat productized version, you can use an `application.properties` file.

For instance for Quarkus, you can provide this content:
```
camel.jbang.repos=https://maven.repository.redhat.com/ga/
# The version is the Quarkus bom https://maven.repository.redhat.com/ga/com/redhat/quarkus/platform/quarkus-camel-bom
camel.jbang.quarkusVersion=3.15.2.redhat-00003
camel.jbang.quarkusGroupId=com.redhat.quarkus.platform
```
Then you can use as usual the command `Camel: Create a Camel Quarkus project` from the command palette.

Note you can further customize the export using this file, see the [upstream documentation](https://camel.apache.org/manual/camel-jbang.html#_configuring_exporting) for available parameters.
