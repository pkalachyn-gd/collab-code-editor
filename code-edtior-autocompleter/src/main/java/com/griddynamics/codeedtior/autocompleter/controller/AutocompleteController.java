package com.griddynamics.codeedtior.autocompleter.controller;

import com.griddynamics.codeedtior.autocompleter.dto.CompletionRequest;
import com.griddynamics.codeedtior.autocompleter.dto.CompletionResponse;
import com.griddynamics.codeedtior.autocompleter.service.AutocompleteService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AutocompleteController {

    private final AutocompleteService autocompleteService;

    public AutocompleteController(AutocompleteService autocompleteService) {
        this.autocompleteService = autocompleteService;
    }

    @PostMapping("/complete")
    public CompletionResponse complete(@Valid @RequestBody CompletionRequest request) {
        return autocompleteService.getSuggestions(request);
    }
}
