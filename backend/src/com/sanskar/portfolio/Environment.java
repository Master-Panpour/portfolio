package com.sanskar.portfolio;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public final class Environment {
    private static final Map<String, String> DOTENV = loadDotenv();

    private Environment() {
    }

    public static String get(String key, String fallback) {
        String value = System.getProperty(key);
        if (isBlank(value)) {
            value = System.getenv(key);
        }
        if (isBlank(value)) {
            value = DOTENV.get(key);
        }
        return isBlank(value) ? fallback : value.trim();
    }

    public static String get(String key) {
        return get(key, null);
    }

    private static Map<String, String> loadDotenv() {
        Path envPath = Paths.get(".env").toAbsolutePath().normalize();
        if (!Files.isRegularFile(envPath)) {
            return Collections.emptyMap();
        }

        Map<String, String> values = new HashMap<String, String>();
        try (BufferedReader reader = Files.newBufferedReader(envPath, StandardCharsets.UTF_8)) {
            String line;
            while ((line = reader.readLine()) != null) {
                parseLine(line, values);
            }
        } catch (IOException ex) {
            return Collections.emptyMap();
        }
        return Collections.unmodifiableMap(values);
    }

    private static void parseLine(String rawLine, Map<String, String> values) {
        String line = rawLine.trim();
        if (line.isEmpty() || line.startsWith("#")) {
            return;
        }
        if (line.startsWith("export ")) {
            line = line.substring("export ".length()).trim();
        }

        int separator = line.indexOf('=');
        if (separator <= 0) {
            return;
        }

        String key = line.substring(0, separator).trim();
        String value = stripInlineComment(line.substring(separator + 1).trim());
        if (!key.matches("[A-Za-z_][A-Za-z0-9_]*")) {
            return;
        }

        values.put(key, unquote(value));
    }

    private static String stripInlineComment(String value) {
        boolean singleQuoted = false;
        boolean doubleQuoted = false;
        for (int i = 0; i < value.length(); i += 1) {
            char current = value.charAt(i);
            if (current == '\'' && !doubleQuoted) {
                singleQuoted = !singleQuoted;
            } else if (current == '"' && !singleQuoted) {
                doubleQuoted = !doubleQuoted;
            } else if (current == '#' && !singleQuoted && !doubleQuoted && (i == 0 || Character.isWhitespace(value.charAt(i - 1)))) {
                return value.substring(0, i).trim();
            }
        }
        return value;
    }

    private static String unquote(String value) {
        if (value.length() >= 2) {
            char first = value.charAt(0);
            char last = value.charAt(value.length() - 1);
            if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                return value.substring(1, value.length() - 1);
            }
        }
        return value;
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
