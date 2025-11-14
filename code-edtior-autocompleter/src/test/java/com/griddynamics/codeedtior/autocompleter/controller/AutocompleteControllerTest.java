package com.griddynamics.codeedtior.autocompleter.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.griddynamics.codeedtior.autocompleter.dto.CompletionRequest;
import com.griddynamics.codeedtior.autocompleter.dto.CompletionResponse;
import com.griddynamics.codeedtior.autocompleter.dto.Suggestion;
import com.griddynamics.codeedtior.autocompleter.service.AutocompleteService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
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

    @MockBean
    private AutocompleteService autocompleteService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testComplete() throws Exception {
        CompletionRequest request = new CompletionRequest(
                "function helloWorld() {\n  console.log('Hello, world'); \n}",
                55,
                "function helloWorld() {\n  console.log('Hello, world'); "
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
}
