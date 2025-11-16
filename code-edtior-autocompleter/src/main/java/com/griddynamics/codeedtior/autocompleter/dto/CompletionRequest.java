package com.griddynamics.codeedtior.autocompleter.dto;

import jakarta.validation.constraints.NotBlank;

public record CompletionRequest(@NotBlank String fullText, int cursorPosition, @NotBlank String textBeforeCursor) {
}
