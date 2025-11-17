package com.griddynamics.codeedtior.autocompleter.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.griddynamics.codeedtior.autocompleter.dto.CompletionRequest;
import com.griddynamics.codeedtior.autocompleter.dto.CompletionResponse;
import com.griddynamics.codeedtior.autocompleter.dto.ErrorResponse;
import com.griddynamics.codeedtior.autocompleter.dto.Suggestion;
import com.griddynamics.codeedtior.autocompleter.exception.JsonParsingException;
import com.griddynamics.codeedtior.autocompleter.service.AutocompleteService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AutocompleteController.class)
public class AutocompleteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AutocompleteService autocompleteService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testComplete() throws Exception {
        CompletionRequest request = new CompletionRequest(
                "function helloWorld() {\n  console.log('Hello, world'); \n}",
                55
        );

        Suggestion suggestion = new Suggestion("console", "variable");
        CompletionResponse response = new CompletionResponse(Collections.singletonList(suggestion));

        when(autocompleteService.getSuggestions(any(CompletionRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().json(objectMapper.writeValueAsString(response)));
    }

    @Test
    public void testComplete_emptySuggestions() throws Exception {
        CompletionRequest request = new CompletionRequest(
                "function helloWorld() {\n  console.log('Hello, world'); \n}",
                55
        );

        CompletionResponse response = new CompletionResponse(Collections.emptyList());

        when(autocompleteService.getSuggestions(any(CompletionRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().json(objectMapper.writeValueAsString(response)));
    }

    @Test
    public void testComplete_JsonParsingException() throws Exception {
        CompletionRequest request = new CompletionRequest(
                "function helloWorld() {\n  console.log('Hello, world'); \n}",
                55
        );

        when(autocompleteService.getSuggestions(any(CompletionRequest.class)))
                .thenThrow(new JsonParsingException("Test Exception", new RuntimeException()));

        ErrorResponse expectedResponse = new ErrorResponse(
                "Failed to parse JSON from AI response",
                HttpStatus.INTERNAL_SERVER_ERROR.value()
        );

        mockMvc.perform(post("/api/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError())
                .andExpect(content().json(objectMapper.writeValueAsString(expectedResponse)));
    }

    @Test
    public void testComplete_fullTextNull() throws Exception {
        CompletionRequest request = new CompletionRequest(
                null,
                55
        );

        ErrorResponse expectedResponse = new ErrorResponse(
                "Validation failed: fullText: must not be blank",
                HttpStatus.BAD_REQUEST.value()
        );

        mockMvc.perform(post("/api/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(content().json(objectMapper.writeValueAsString(expectedResponse)));
    }

    @Test
    public void testComplete_fullTextEmpty() throws Exception {
        CompletionRequest request = new CompletionRequest(
                "",
                55
        );

        ErrorResponse expectedResponse = new ErrorResponse(
                "Validation failed: fullText: must not be blank",
                HttpStatus.BAD_REQUEST.value()
        );

        mockMvc.perform(post("/api/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(content().json(objectMapper.writeValueAsString(expectedResponse)));
    }

    @Test
    public void testComplete_fullTextBlank() throws Exception {
        CompletionRequest request = new CompletionRequest(
                "   ",
                55
        );

        ErrorResponse expectedResponse = new ErrorResponse(
                "Validation failed: fullText: must not be blank",
                HttpStatus.BAD_REQUEST.value()
        );

        mockMvc.perform(post("/api/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(content().json(objectMapper.writeValueAsString(expectedResponse)));
    }


}
