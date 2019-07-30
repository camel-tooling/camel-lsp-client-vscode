[![GitHub tag](https://img.shields.io/github/tag/camel-tooling/camel-lsp-client-vscode.svg?style=plastic)]()
[![Build Status](https://travis-ci.org/camel-tooling/camel-lsp-client-vscode.svg?branch=master)](https://travis-ci.org/camel-tooling/camel-lsp-client-vscode)
[![License](https://img.shields.io/badge/license-Apache%202-blue.svg)]()
[![Gitter](https://img.shields.io/gitter/room/camel-tooling/Lobby.js.svg)](https://gitter.im/camel-tooling/Lobby)

# Apache Camel for Visual Studio Code
This is a preview release of the [Visual Studio Code](https://code.visualstudio.com/) extension that adds [Apache Camel](http://camel.apache.org/) language support for XML DSL and Java DSL code.
  
When you add this extension to your installation of VS Code, the VS Code editor provides the following features:

* Language service support for Apache Camel URIs (both XML DSL and Java DSL)

   * Auto-completion for Camel components, attributes, and the list of attribute values
  
     XML DSL
     
     ![Completion for XML DSL](./images/completion.gif "Completion for XML DSL")
     
     Java DSL 
     
     ![Completion for Java DSL](./images/completionJava.gif "Completion for Java DSL")

	 Camel-K Groovy DSL (It requires to have file named with the pattern _*.camelk.groovy_ or that the file starts with _// camel-k:_)

     ![Completion for Groovy DSL](./images/completionGroovy.gif "Completion for Groovy DSL")

	 Camel Kafka Connect properties

	 ![Completion for Camel Kafka Connect](./images/completionCamelKafkaConnect.gif "Completion for Camel Kafka Connect")
    
   * Quick reference documentation when you hover the cursor over a Camel component
   
    ![Quick reference for XML DSL](./images/hoverDoc.png "Quick Reference for XML DSL")
    
* Diagnostics for Camel URIs when you save a file (both XML DSL and Java DSL)

    ![Diagnostic for XML DSL](./images/diagnostic.png "Diagnostic for XML DSL")
    
* Navigation to Camel contexts and routes in the VS Code outline panel and in the **Go > Go to Symbol in File** navigation panel (XML DSL only)

  ![Navigation support for Camel contexts and routes for XML DSL](./images/navigationSymbol.gif "Navigation support for Camel contexts and routes for XML DSL")

* Auto-completion for referenced IDs of `direct`, `direct VM`, `VM` and `SEDA` components (XML DSL only)
  
  ![Reference ID completion for XML DSL](./images/directIdCompletion.png "Reference ID completion for XML DSL")
  
* Find references for `direct` and `direct VM` components in all open Camel files (XML DSL only)
  
  ![Find References for XML DSL](./images/findReference.gif "Find References for XML DSL")


For detailed information about Apache Camel supported features, see the [Language Server GitHub page](https://github.com/camel-tooling/camel-language-server#features).

## Contact Us
If you run into an issue or have a suggestion, you can report it by [creating a new issue on GitHub](https://github.com/camel-tooling/camel-lsp-client-vscode/issues).

## How to install
You can download this **Language Support for Apache Camel** extension from the Visual Studio Code Marketplace at https://marketplace.visualstudio.com/items?itemName=camel-tooling.vscode-apache-camel.

After you install VS Code, follow these steps:
1. In VS Code, select **View > Extensions**.
2. Search for **Camel**.
3. Select the **Language Support for Apache Camel** option and then click *Install*.

## Requirements for using this extension

After you install this **Language Support for Apache Camel** extension, follow these guidelines to access its features:
 
For an XML DSL file:
* Use an `.xml` file extension.
* Specify the Camel namespace http://camel.apache.org/schema/blueprint or http://camel.apache.org/schema/spring.

For a Java DSL file:
* Use a `.java` file extension. 
* Specify Camel (usually from an imported package). 
  For example: `import org.apache.camel.builder.RouteBuilder`
* To reference the Camel component, use `from` or `to` and a string without a space. The string cannot be a variable. For example, `from("timer:timerName")` works but `from( "timer:timerName")` and `from(aVariable)` do not work.

