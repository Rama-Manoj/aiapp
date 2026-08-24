package com.example.aiapp.service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import com.example.aiapp.dto.AiHistoryDto;
import com.example.aiapp.entity.AiRequest;
import com.example.aiapp.repository.AiRequestRepository;

@Service
public class GeminiService {

    private static final String GROQ_URL =
            "https://api.groq.com/openai/v1/chat/completions";

    /*
     * Current Groq model.
     *
     * GPT-OSS 20B supports Groq's built-in browser_search tool.
     */
    private static final String GROQ_MODEL =
            "openai/gpt-oss-20b";

    private final AiRequestRepository aiRequestRepository;

    @Value("${groq.api.key}")
    private String apiKey;

    public GeminiService(AiRequestRepository aiRequestRepository) {
        this.aiRequestRepository = aiRequestRepository;
    }

    /**
     * Returns paginated AI request history.
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
     * Deletes AI history entry.
     */
    public void deleteHistory(Long id) {
        aiRequestRepository.deleteById(id);
    }

    /**
     * Main AI processing method.
     *
     * Explain:
     * - Uses browser search only when the question requires
     *   current/latest information.
     *
     * Summarize:
     * - Uses normal AI processing.
     *
     * Rewrite:
     * - Uses normal AI processing.
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
                action == null ? "EXPLAIN" : action.trim().toUpperCase();

        String prompt = buildPrompt(text, safeAction);

        /*
         * Only use browser search when it is actually useful.
         *
         * This prevents unnecessary web searches for:
         * - Summarize
         * - Rewrite
         * - Normal explanations
         */
        boolean useWebSearch =
                safeAction.equals("EXPLAIN")
                        && requiresCurrentInformation(text);

        String output = callGroqApi(prompt, useWebSearch);

        /*
         * Save the successful AI response.
         */
        AiRequest aiRequest = new AiRequest();

        aiRequest.setInputText(text);
        aiRequest.setAction(safeAction);
        aiRequest.setOutput(output);
        aiRequest.setUserId(userId);
        aiRequest.setCreatedAt(LocalDateTime.now());

        aiRequestRepository.save(aiRequest);

        return Map.of("output", output);
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

                    Preserve the important facts and meaning.
                    Do not add information that is not present in the text.

                    Text:
                    %s
                    """.formatted(text);

            case "REWRITE" ->
                    """
                    Rewrite the following text in a professional,
                    clear and natural style.

                    Preserve the original meaning.
                    Do not add unnecessary information.

                    Text:
                    %s
                    """.formatted(text);

            case "EXPLAIN" ->
                    """
                    Answer the user's question accurately and clearly.

                    If the question requires current, latest, recent,
                    today's, 2026, or otherwise up-to-date information,
                    use web search.

                    When web search is used:
                    - Prefer reliable and authoritative sources.
                    - Use recent information.
                    - Mention important source names and dates when useful.
                    - Do not invent facts.
                    - Keep the answer well structured.
                    - For large questions, answer all major parts
                      without unnecessary repetition.

                    For questions that do not require current information,
                    answer directly using your knowledge.

                    User question:
                    %s
                    """.formatted(text);

            default ->
                    """
                    Answer the following question accurately and clearly.

                    If current information is required, use web search.

                    User question:
                    %s
                    """.formatted(text);
        };
    }

    /**
     * Detects whether the user is asking for information that
     * may require live web search.
     *
     * This is intentionally keyword-based and simple.
     * It avoids web searching every normal AI request.
     */
    private boolean requiresCurrentInformation(String text) {

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
                "latest update",
                "recent update",
                "announced",
                "announcement",
                "what happened"
        };

        for (String keyword : currentKeywords) {

            if (lower.contains(keyword)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Calls Groq.
     *
     * IMPORTANT:
     * This method performs ONE API request only.
     *
     * There is intentionally NO retry loop.
     * Therefore the same user task will never automatically
     * be sent to Groq again and again.
     */
    private String callGroqApi(
            String prompt,
            boolean useWebSearch) {

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_JSON);

        headers.setBearerAuth(apiKey);

        /*
         * Groq recommends the latest model version header
         * for built-in tool usage.
         */
        headers.set(
                "Groq-Model-Version",
                "latest");

        /*
         * LinkedHashMap makes the JSON request easier to
         * read and debug.
         */
        Map<String, Object> body =
                new LinkedHashMap<>();

        body.put(
                "model",
                GROQ_MODEL);

        body.put(
                "messages",
                List.of(
                        Map.of(
                                "role",
                                "user",

                                "content",
                                prompt)));

        /*
         * GPT-OSS 20B supports a 131K context window and
         * large output limits.
         *
         * 16K is intentionally used here rather than the
         * maximum 65K because most AI-helper answers do not
         * need 65K tokens and unnecessarily huge responses
         * increase latency and storage requirements.
         */
        body.put(
                "max_completion_tokens",
                16384);

        /*
         * Low reasoning effort reduces unnecessary browsing
         * and token usage for browser-search requests.
         */
        body.put(
                "reasoning_effort",
                "low");

        body.put(
                "temperature",
                1);

        body.put(
                "top_p",
                1);

        /*
         * Use browser search ONLY for current-information
         * questions.
         */
        if (useWebSearch) {

            body.put(
                    "tool_choice",
                    "required");

            body.put(
                    "tools",
                    List.of(
                            Map.of(
                                    "type",
                                    "browser_search")));
        }

        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(
                        body,
                        headers);

        try {

            /*
             * Exactly ONE request.
             *
             * No retry loop.
             */
            Map<?, ?> response =
                    restTemplate.postForObject(
                            GROQ_URL,
                            entity,
                            Map.class);

            if (response == null) {

                throw new RuntimeException(
                        "Groq returned an empty response.");
            }

            Object choicesObject =
                    response.get("choices");

            if (!(choicesObject instanceof List<?> choices)
                    || choices.isEmpty()) {

                throw new RuntimeException(
                        "Groq returned no choices.");
            }

            Object firstChoice =
                    choices.get(0);

            if (!(firstChoice instanceof Map<?, ?> choice)) {

                throw new RuntimeException(
                        "Invalid Groq response format.");
            }

            Object messageObject =
                    choice.get("message");

            if (!(messageObject instanceof Map<?, ?> message)) {

                throw new RuntimeException(
                        "Groq response does not contain a message.");
            }

            Object contentObject =
                    message.get("content");

            if (contentObject == null) {

                throw new RuntimeException(
                        "Groq returned an empty message.");
            }

            String content =
                    contentObject.toString().trim();

            if (content.isEmpty()) {

                throw new RuntimeException(
                        "Groq returned empty content.");
            }

            return content;

        } catch (HttpClientErrorException e) {

            /*
             * 400 / 401 / 403 / 404 / 413 / 429 etc.
             *
             * We do NOT retry.
             */
            String errorBody =
                    e.getResponseBodyAsString();

            System.err.println(
                    "Groq client error: "
                            + e.getStatusCode());

            System.err.println(
                    "Groq response: "
                            + errorBody);

            throw new RuntimeException(
                    "Groq API error "
                            + e.getStatusCode()
                            + ": "
                            + errorBody,
                    e);

        } catch (HttpServerErrorException e) {

            /*
             * 5xx errors.
             *
             * We do NOT retry automatically.
             */
            String errorBody =
                    e.getResponseBodyAsString();

            System.err.println(
                    "Groq server error: "
                            + e.getStatusCode());

            System.err.println(
                    "Groq response: "
                            + errorBody);

            throw new RuntimeException(
                    "Groq server error "
                            + e.getStatusCode()
                            + ": "
                            + errorBody,
                    e);

        } catch (Exception e) {

            /*
             * Any other unexpected problem.
             *
             * Again: no automatic retry.
             */
            e.printStackTrace();

            throw new RuntimeException(
                    "Unable to process Groq AI request: "
                            + e.getMessage(),
                    e);
        }
    }
}
