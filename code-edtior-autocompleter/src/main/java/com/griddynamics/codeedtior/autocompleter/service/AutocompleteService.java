package com.griddynamics.codeedtior.autocompleter.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.griddynamics.codeedtior.autocompleter.dto.CompletionRequest;
import com.griddynamics.codeedtior.autocompleter.dto.CompletionResponse;
import com.griddynamics.codeedtior.autocompleter.dto.Suggestion;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class AutocompleteService {
    private static final String PROMPT = "You are a code completion assistant. Given the following code context, provide a list of up to 5 code completion suggestions. " +
            "Each suggestion should be short (1-3 words) and include its type (e.g., 'variable', 'function', 'keyword', 'class', 'interface', 'module', 'property')." +
            "\n\nThe user is editing a file with the following code:\n---%s" +
            "\n---\n\nThe cursor is at position %s" +
            ". The text before the cursor is:\n---%s" +
            "\n---\n\nPlease provide the suggestions in a JSON array format, where each object has a \"label\" and a \"type\" property. For example:\n" +
            "["
            + "  {\"label\": \"console.log\", \"type\": \"function\"},"
            + "  {\"label\": \"const\", \"type\": \"keyword\"}"
            + "]";

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    public AutocompleteService(ChatClient.Builder chatClientBuilder, ObjectMapper objectMapper) {
        this.chatClient = chatClientBuilder.build();
        this.objectMapper = objectMapper;
    }

    public CompletionResponse getSuggestions(CompletionRequest request) {
        String prompt = createPrompt(request);
        String content = chatClient.prompt().user(prompt).call().content();
        List<Suggestion> suggestions = parseResponse(content);
        return new CompletionResponse(suggestions);
    }

    private String createPrompt(CompletionRequest request) {
        return PROMPT.formatted(request.fullText(), request.cursorPosition(), request.textBeforeCursor());
    }

    private List<Suggestion> parseResponse(String response) {
        try {
            int jsonStart = response.indexOf("[");
            int jsonEnd = response.lastIndexOf("]");
            if (jsonStart != -1 && jsonEnd != -1) {
                String json = response.substring(jsonStart, jsonEnd + 1);
                return objectMapper.readValue(json, new TypeReference<>() {
                });
            }
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
        return Collections.emptyList();
    }
}
