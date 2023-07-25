import org.apache.camel.builder.RouteBuilder;

public class codeNavigation extends RouteBuilder {

    @Override
    public void configure() throws Exception {
        from("timer:java?period={{time:1000}}")
            .setBody()
                .simple("Hello Camel")
            .log("${body}");

        from("timer:java2?period={{time:1000}}")
            .setHeader("example")
                .constant("Java")
        .to("log:info");
    }
}
