#Change Log

## 0.0.13

- Live-validation, no more need to save file to have validation
- Generate log file of Camel Language Server in Java temporary folder instead of the opened folder

## 0.0.12

- Completion for referenced ids for direct, direct-vm, vm and seda components
- Fix incompatibility with Java Extension pack and Spring Boot Extension pack

## 0.0.11

- Fix regression of missing completion for empty uris and missing default values

## 0.0.10

- Find references for direct and direct-vm component (Shift + F12)
- Depending on hovered part of the Camel URI, hover now provides documentation for Camel Component or Camel attributes
- Completion now insert-and-replace the component/attribute when completion triggered in middle of the element

## 0.0.9

- support navigation on Camel context with XML DSL (Ctrl+Shift+O and outline)
- support single quote notation for XML attributes
- support completion on global endpoint with XML DSL

## 0.0.8

- support diagnostic for Camel URI with XML DSL (updated on save)

## 0.0.7

- support Camel URI completion and hover in Java DSL for Camel files

## 0.0.3

- support Camel URI completion with XML DSL
- support hover documentation on Camel URI with XML DSL
- support navigation on routes with XML DSL (Ctrl+Shift+O)