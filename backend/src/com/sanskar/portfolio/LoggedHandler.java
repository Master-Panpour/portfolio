package com.sanskar.portfolio;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;

public final class LoggedHandler implements HttpHandler {
    private final HttpHandler delegate;
    private final AccessLogger accessLogger;

    public LoggedHandler(HttpHandler delegate, AccessLogger accessLogger) {
        this.delegate = delegate;
        this.accessLogger = accessLogger;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        accessLogger.log(exchange);
        delegate.handle(exchange);
    }
}
