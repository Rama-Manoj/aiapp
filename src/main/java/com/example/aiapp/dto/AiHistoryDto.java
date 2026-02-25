package com.example.aiapp.dto;

import java.time.LocalDateTime;

public class AiHistoryDto {

    private Long id;
    private String input;
    private String output;
    private LocalDateTime createdAt;
    private String action;

    public AiHistoryDto(Long id, String input, String output, LocalDateTime createdAt, String action) {
        this.id = id;
        this.input = input;
        this.output = output;
        this.createdAt = createdAt;
        this.action = action;
    }

    public Long getId() {
        return id;
    }

    public String getInput() {
        return input;
    }

    public String getOutput() {
        return output;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getAction() {
        return action;
    }
}
