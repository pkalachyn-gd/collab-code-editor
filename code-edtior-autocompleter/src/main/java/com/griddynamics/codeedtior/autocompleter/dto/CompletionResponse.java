package com.griddynamics.codeedtior.autocompleter.dto;

import java.util.List;

public record CompletionResponse(List<Suggestion> suggestions) {
}
