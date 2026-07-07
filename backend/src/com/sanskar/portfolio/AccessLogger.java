package com.sanskar.portfolio;

import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Instant;

public final class AccessLogger {
    private static final int MAX_FIELD_LENGTH = 240;

    private final Path logPath;

    public AccessLogger(Path logPath) {
        this.logPath = logPath;
    }

    public synchronized void log(HttpExchange exchange) {
        try {
            Path parent = logPath.getParent();
            if (parent != null) {
                Files.createDirectories(parent);
            }

            String line = "{"
                    + "\"ts\":\"" + escape(Instant.now().toString()) + "\","
                    + "\"method\":\"" + escape(limit(exchange.getRequestMethod())) + "\","
                    + "\"path\":\"" + escape(limit(exchange.getRequestURI().getPath())) + "\","
                    + "\"remote\":\"" + escape(remoteAddress(exchange)) + "\","
                    + "\"userAgent\":\"" + escape(limit(exchange.getRequestHeaders().getFirst("User-Agent"))) + "\","
                    + "\"referer\":\"" + escape(limit(exchange.getRequestHeaders().getFirst("Referer"))) + "\""
                    + "}\n";

            Files.write(logPath, line.getBytes(StandardCharsets.UTF_8),
                    StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.APPEND);
        } catch (IOException ignored) {
            // Logging must never break request handling.
        }
    }

    private static String remoteAddress(HttpExchange exchange) {
        if (exchange.getRemoteAddress() == null || exchange.getRemoteAddress().getAddress() == null) {
            return "";
        }
        return limit(exchange.getRemoteAddress().getAddress().getHostAddress());
    }

    private static String limit(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.replace('\n', ' ').replace('\r', ' ').trim();
        return trimmed.length() > MAX_FIELD_LENGTH ? trimmed.substring(0, MAX_FIELD_LENGTH) : trimmed;
    }

    private static String escape(String value) {
        StringBuilder builder = new StringBuilder(value.length() + 16);
        for (int index = 0; index < value.length(); index += 1) {
            char current = value.charAt(index);
            switch (current) {
                case '\\':
                    builder.append("\\\\");
                    break;
                case '"':
                    builder.append("\\\"");
                    break;
                case '\b':
                    builder.append("\\b");
                    break;
                case '\f':
                    builder.append("\\f");
                    break;
                case '\n':
                    builder.append("\\n");
                    break;
                case '\r':
                    builder.append("\\r");
                    break;
                case '\t':
                    builder.append("\\t");
                    break;
                default:
                    if (current < 0x20) {
                        builder.append(String.format("\\u%04x", (int) current));
                    } else {
                        builder.append(current);
                    }
                    break;
            }
        }
        return builder.toString();
    }
}
