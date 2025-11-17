package com.griddynamics.codeedtior.autocompleter.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.griddynamics.codeedtior.autocompleter.dto.CompletionRequest;
import com.griddynamics.codeedtior.autocompleter.dto.CompletionResponse;
import com.griddynamics.codeedtior.autocompleter.dto.Suggestion;
import com.griddynamics.codeedtior.autocompleter.exception.JsonParsingException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AutocompleteServiceTest {

    @Mock
    private ChatClient.Builder chatClientBuilder;

    @Mock
    private ChatClient chatClient;

    @Mock
    private ObjectMapper objectMapper;

    private AutocompleteService autocompleteService;

    @BeforeEach
    void setUp() {
        when(chatClientBuilder.build()).thenReturn(chatClient);
        autocompleteService = new AutocompleteService(chatClientBuilder, objectMapper);
    }

    @Test
    void testGetSuggestions_success() throws JsonProcessingException {
        // Given
        CompletionRequest request = new CompletionRequest("test", 0);
        String jsonResponse = "[{\"label\":\"suggestion1\",\"type\":\"type1\"}]";
        List<Suggestion> suggestions = Collections.singletonList(new Suggestion("suggestion1", "type1"));

        ChatClient.ChatClientRequestSpec prompt = mock(ChatClient.ChatClientRequestSpec.class);
        ChatClient.CallResponseSpec call = mock(ChatClient.CallResponseSpec.class);
        when(chatClient.prompt()).thenReturn(prompt);
        when(prompt.user(anyString())).thenReturn(prompt);
        when(prompt.call()).thenReturn(call);
        when(call.content()).thenReturn(jsonResponse);
        when(objectMapper.readValue(anyString(), any(TypeReference.class))).thenReturn(suggestions);

        // When
        CompletionResponse response = autocompleteService.getSuggestions(request);

        // Then
        assertNotNull(response);
        assertEquals(1, response.suggestions().size());
        assertEquals("suggestion1", response.suggestions().getFirst().label());
    }

    @Test
    void testGetSuggestions_emptyResponse() throws JsonProcessingException {
        // Given
        CompletionRequest request = new CompletionRequest("test", 0);
        String jsonResponse = "[]";
        List<Suggestion> suggestions = Collections.emptyList();

        ChatClient.ChatClientRequestSpec prompt = mock(ChatClient.ChatClientRequestSpec.class);
        ChatClient.CallResponseSpec call = mock(ChatClient.CallResponseSpec.class);
        when(chatClient.prompt()).thenReturn(prompt);
        when(prompt.user(anyString())).thenReturn(prompt);
        when(prompt.call()).thenReturn(call);
        when(call.content()).thenReturn(jsonResponse);
        when(objectMapper.readValue(anyString(), any(TypeReference.class))).thenReturn(suggestions);

        // When
        CompletionResponse response = autocompleteService.getSuggestions(request);

        // Then
        assertNotNull(response);
        assertTrue(response.suggestions().isEmpty());
    }

    @Test
    void testGetSuggestions_jsonParsingException() throws JsonProcessingException {
        // Given
        CompletionRequest request = new CompletionRequest("test", 0);
        String malformedJsonResponse = "[invalid-json]";

        ChatClient.ChatClientRequestSpec prompt = mock(ChatClient.ChatClientRequestSpec.class);
        ChatClient.CallResponseSpec call = mock(ChatClient.CallResponseSpec.class);
        when(chatClient.prompt()).thenReturn(prompt);
        when(prompt.user(anyString())).thenReturn(prompt);
        when(prompt.call()).thenReturn(call);
        when(call.content()).thenReturn(malformedJsonResponse);
        when(objectMapper.readValue(anyString(), any(TypeReference.class))).thenThrow(JsonProcessingException.class);

        // When & Then
        assertThrows(JsonParsingException.class, () -> autocompleteService.getSuggestions(request));
    }

    @Test
    void testGetSuggestions_noJsonArrayInResponse() {
        // Given
        CompletionRequest request = new CompletionRequest("test", 0);
        String responseWithoutJson = "no json array";

        ChatClient.ChatClientRequestSpec prompt = mock(ChatClient.ChatClientRequestSpec.class);
        ChatClient.CallResponseSpec call = mock(ChatClient.CallResponseSpec.class);
        when(chatClient.prompt()).thenReturn(prompt);
        when(prompt.user(anyString())).thenReturn(prompt);
        when(prompt.call()).thenReturn(call);
        when(call.content()).thenReturn(responseWithoutJson);

        // When & Then
        assertThrows(JsonParsingException.class, () -> autocompleteService.getSuggestions(request));
    }
}
