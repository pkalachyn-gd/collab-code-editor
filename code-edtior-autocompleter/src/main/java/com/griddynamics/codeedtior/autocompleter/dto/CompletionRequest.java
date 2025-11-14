package com.griddynamics.codeedtior.autocompleter.dto;

public record CompletionRequest(String fullText, int cursorPosition, String textBeforeCursor) {
}
