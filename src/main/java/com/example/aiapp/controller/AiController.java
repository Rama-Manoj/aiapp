package com.example.aiapp.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.aiapp.dto.AiHistoryDto;
import com.example.aiapp.dto.AiRequestDto;
import com.example.aiapp.service.GeminiService;

@RestController
@RequestMapping("/ai")
public class AiController {

    private final GeminiService service;

    @Autowired
    private GeminiService geminiService;

    public AiController(GeminiService service) {
        this.service = service;
    }

    @GetMapping("/history")
    public Page<AiHistoryDto> getHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam Long userId) {
        return service.getHistory(page, size, userId);
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/history/{id}")
    public Map<String, Boolean> deleteHistory(@org.springframework.web.bind.annotation.PathVariable Long id) {
        service.deleteHistory(id);
        return Map.of("success", true);
    }

    @PostMapping("/process")
    public Map<String, String> process(@RequestBody AiRequestDto dto) {

        if (dto.getUserId() == null) {
            throw new RuntimeException("User must be logged in to use AI");
        }

        return geminiService.process(
                dto.getText(),
                dto.getAction(),
                dto.getUserId());
    }

}
