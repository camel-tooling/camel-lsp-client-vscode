// camel-k: language=js

from('')
    .routeId('js')
    .setBody()
        .simple('Hello World')
    .to('')
