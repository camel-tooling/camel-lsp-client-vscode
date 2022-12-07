## Camel Kafka Connector support

- Completion and hover for Camel URIs as property values of `camel.sink.url` and `camel.source.url`
- Completion and hover for `connector.class` property value based on Camel Kafka Connector Catalog.
- Completion and hover for `camel.sink.*` and `camel.source.*` property keys based on Camel Kafka Connector Catalog.
- Completion for `key.converter` and `value.converter` property values based on Camel Kafka Connector Catalog.
- Completion for `transforms.*.type` property values based on Camel Kafka Connector Catalog.
- Completion for [basic configuration](https://camel.apache.org/components/3.20.x/kafka-component.html)
- Diagnostic in Camel Kafka Connector files:
  - for invalid `camel.(source|sink).(endpoint|path).*` property keys. A quickfix is provided as well for close property keys.
  - for mix of source and sink property keys
  - for mix of `camel.(source|sink).(endpoint|path).*` and `camel.(source|sink).url` usage
  - for duplicated keys differentiated by dash case or camel case
