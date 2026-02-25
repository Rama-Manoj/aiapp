package com.example.aiapp.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.example.aiapp.dto.AiHistoryDto;
import com.example.aiapp.entity.AiRequest;
import com.example.aiapp.repository.AiRequestRepository;

@Service
public class GeminiService {

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    private final AiRequestRepository aiRequestRepository;

    @Value("${groq.api.key}")
    private String apiKey;

    public GeminiService(AiRequestRepository aiRequestRepository) {
        this.aiRequestRepository = aiRequestRepository;
    }

    /**
     * Returns a paginated list of AI request history, ordered by createdAt
     * descending.
     *
     * @param page zero-based page index
     * @param size number of records per page
     * @return a page of AiHistoryDto
     */
    public Page<AiHistoryDto> getHistory(int page, int size, Long userId) {
        return aiRequestRepository.findAllByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .map(entity -> new AiHistoryDto(
                        entity.getId(),
                        entity.getInputText(),
                        entity.getOutput(),
                        entity.getCreatedAt(),
                        entity.getAction()));
    }

    public void deleteHistory(Long id) {
        aiRequestRepository.deleteById(id);
    }

    /**
     * Processes the given text using the specified action and persists the request.
     *
     * @param text   the input text to process
     * @param action the AI action – EXPLAIN, SUMMARIZE, or REWRITE
     * @param userId the ID of the user making the request
     * @return a map containing the key "output" with the AI-generated result
     */
    public Map<String, String> process(String text, String action, Long userId) {
        String prompt = buildPrompt(text, action);
        String output = callGroqApi(prompt);

        AiRequest aiRequest = new AiRequest();
        aiRequest.setInputText(text);
        aiRequest.setAction(action);
        aiRequest.setOutput(output);
        aiRequest.setUserId(userId);
        aiRequest.setCreatedAt(LocalDateTime.now());

        aiRequestRepository.save(aiRequest);

        return Map.of("output", output);
    }

    /**
     * Builds a prompt string tailored to the requested action.
     */
    private String buildPrompt(String text, String action) {
        return switch (action.toUpperCase()) {
            case "SUMMARIZE" -> "Summarize this text:\n" + text;
            case "REWRITE" -> "Rewrite this professionally:\n" + text;
            case "EXPLAIN" -> "Explain this clearly:\n" + text;
            default -> "Explain this clearly:\n" + text;
        };
    }

    /**
     * Calls the Groq (LLaMA) chat-completion API and extracts the response content.
     */
    private String callGroqApi(String prompt) {
        RestTemplate restTemplate = new RestTemplate();

        Map<String, Object> body = Map.of(
                "model", "llama-3.1-8b-instant",
                "messages", List.of(Map.of("role", "user", "content", prompt)));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            Map<?, ?> response = restTemplate.postForObject(GROQ_URL, entity, Map.class);

            if (response == null) {
                return "AI service returned an empty response.";
            }

            List<?> choices = (List<?>) response.get("choices");
            Map<?, ?> message = (Map<?, ?>) ((Map<?, ?>) choices.get(0)).get("message");
            return message.get("content").toString();

        } catch (Exception e) {
            return "AI service unavailable. Please try again later.";
        }
    }
}
