package com.example.aiapp.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.ThinkingConfig;
import com.google.genai.types.GoogleSearch;
import com.google.genai.types.Tool;

import com.example.aiapp.dto.AiHistoryDto;
import com.example.aiapp.entity.AiRequest;
import com.example.aiapp.repository.AiRequestRepository;

@Service
public class GeminiService {

    private final AiRequestRepository aiRequestRepository;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String model;

    public GeminiService(AiRequestRepository aiRequestRepository) {
        this.aiRequestRepository = aiRequestRepository;
    }

    /**
     * Returns paginated AI request history for a specific user.
     */
    public Page<AiHistoryDto> getHistory(
            int page,
            int size,
            Long userId) {

        return aiRequestRepository
                .findAllByUserIdOrderByCreatedAtDesc(
                        userId,
                        PageRequest.of(page, size))
                .map(entity -> new AiHistoryDto(
                        entity.getId(),
                        entity.getInputText(),
                        entity.getOutput(),
                        entity.getCreatedAt(),
                        entity.getAction()));
    }

    /**
     * Deletes an AI history entry.
     */
    public void deleteHistory(Long id) {
        aiRequestRepository.deleteById(id);
    }

    /**
     * Main AI processing method.
     *
     * EXPLAIN:
     * Uses Gemini normally, or Gemini + Google Search when
     * the question requires current information.
     *
     * SUMMARIZE:
     * Uses normal Gemini processing.
     *
     * REWRITE:
     * Uses normal Gemini processing.
     */
    public Map<String, String> process(
            String text,
            String action,
            Long userId) {

        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "AI input cannot be empty.");
        }

        String safeAction =
                action == null
                        ? "EXPLAIN"
                        : action.trim().toUpperCase();

        String prompt =
                buildPrompt(text, safeAction);

        /*
         * Google Search is used only for EXPLAIN questions
         * that require current information.
         */
        boolean useWebSearch =
                safeAction.equals("EXPLAIN")
                        && requiresCurrentInformation(text);

        /*
         * Exactly ONE Gemini request is made here.
         * There is no automatic retry loop.
         */
        String output =
                callGeminiApi(
                        prompt,
                        useWebSearch);

        /*
         * Save the request and response to MySQL.
         */
        AiRequest aiRequest =
                new AiRequest();

        aiRequest.setInputText(text);
        aiRequest.setAction(safeAction);
        aiRequest.setOutput(output);
        aiRequest.setUserId(userId);
        aiRequest.setCreatedAt(
                LocalDateTime.now());

        aiRequestRepository.save(aiRequest);

        return Map.of(
                "output",
                output);
    }

    /**
     * Builds the prompt according to the selected action.
     */
    private String buildPrompt(
            String text,
            String action) {

        return switch (action) {

            case "SUMMARIZE" ->
                    """
                    Summarize the following text clearly and accurately.

                    Preserve the important facts and original meaning.

                    Do not add information that is not present
                    in the supplied text.

                    Keep the summary concise but complete.

                    Text:
                    %s
                    """.formatted(text);

            case "REWRITE" ->
                    """
                    Rewrite the following text in a professional,
                    clear and natural style.

                    Preserve the original meaning.

                    Improve grammar, clarity, structure,
                    and overall readability.

                    Do not add unnecessary information.

                    Text:
                    %s
                    """.formatted(text);

            case "EXPLAIN" ->
                    """
                    Answer the user's question accurately,
                    clearly, and naturally.

                    If the question requires current, latest,
                    recent, today's, or otherwise up-to-date
                    information, use Google Search.

                    When using Google Search:

                    - Prefer reliable and authoritative sources.
                    - Prefer recent information.
                    - Do not invent facts.
                    - Mention important sources when appropriate.
                    - Include dates when they are relevant.
                    - Clearly distinguish current information
                      from general background knowledge.

                    For normal questions that do not require
                    current information, answer directly.

                    For large questions:

                    - Address all major parts of the question.
                    - Organize the response with headings or bullets
                      when useful.
                    - Avoid unnecessary repetition.
                    - Give a complete answer rather than stopping
                      after the first part.

                    User question:
                    %s
                    """.formatted(text);

            default ->
                    """
                    Answer the following question accurately
                    and clearly.

                    If current information is required,
                    use Google Search.

                    For large questions, answer all major
                    parts in a well-structured way.

                    User question:
                    %s
                    """.formatted(text);
        };
    }

    /**
     * Determines whether the question probably requires
     * current web information.
     */
    private boolean requiresCurrentInformation(
            String text) {

        if (text == null || text.isBlank()) {
            return false;
        }

        String lower =
                text.toLowerCase();

        String[] currentKeywords = {

                "today",
                "current",
                "currently",
                "latest",
                "recent",
                "recently",

                "up-to-date",
                "up to date",
                "uptodate",

                "this week",
                "this month",
                "this year",

                "2026",

                "now",
                "right now",

                "as of today",
                "as of now",

                "last 24 hours",
                "last 7 days",

                "latest news",
                "recent news",
                "current news",

                "new release",
                "latest release",

                "latest version",
                "current version",

                "current price",
                "latest price",

                "latest update",
                "recent update",

                "announced",
                "announcement",

                "what happened",

                "newly released",
                "newly announced"
        };

        for (String keyword :
                currentKeywords) {

            if (lower.contains(keyword)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Sends exactly one request to Gemini.
     *
     * Google Search is added only when useWebSearch
     * is true.
     *
     * There is intentionally NO retry loop.
     */
    private String callGeminiApi(
            String prompt,
            boolean useWebSearch) {

        try {

            /*
             * Create Gemini client using the API key
             * supplied through GEMINI_API_KEY.
             */
            Client client =
                    Client.builder()
                            .apiKey(apiKey)
                            .build();

            /*
             * Configure Gemini generation.
             *
             * 16,384 output tokens gives the model enough
             * room for large answers while avoiding
             * unnecessarily huge responses.
             */
            GenerateContentConfig.Builder configBuilder =
                    GenerateContentConfig
                            .builder()
                            .maxOutputTokens(4096)
                            .thinkingConfig(ThinkingConfig.builder()
                                .thinkingLevel("low")
                                .build());

            /*
             * Enable Google Search grounding only when
             * the question requires current information.
             */
            if (useWebSearch) {

                Tool googleSearchTool =
                        Tool.builder()
                                .googleSearch(
                                        GoogleSearch.builder()
                                                .build())
                                .build();

                configBuilder.tools(
                        List.of(
                                googleSearchTool));
            }

            GenerateContentConfig config =
                    configBuilder.build();

            /*
             * Exactly ONE request to Gemini.
             */
            GenerateContentResponse response =
                    client.models.generateContent(
                            model,
                            prompt,
                            config);

            if (response == null) {

                throw new RuntimeException(
                        "Gemini returned an empty response.");
            }

            String output =
                    response.text();

            if (output == null
                    || output.trim().isEmpty()) {

                throw new RuntimeException(
                        "Gemini returned empty content.");
            }

            return output.trim();

        } catch (Exception e) {

            /*
             * Log the real error in Render logs.
             *
             * No automatic retry is performed.
             */
            System.err.println(
                    "Gemini API error: "
                            + e.getMessage());

            e.printStackTrace();

            throw new RuntimeException(
                    "Unable to process Gemini AI request: "
                            + e.getMessage(),
                    e);
        }
    }
}
