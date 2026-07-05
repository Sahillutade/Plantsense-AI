package com.example.backend.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class EmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingService.class);

    private static final String HF_MODEL_URL = 
    "https://api-inference.huggingface.co/pipeline/feature-extraction/" + "sentence-transformers/all-MiniLM-L6-v2";

    private static final int TIMEOUT_SECONDS = 60;

    private static final int MAX_RETRIES = 3;
    private static final int RETRY_DELAY_MS = 5000;

    @Value("${huggingface.api.key}")
    private String apiKey;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public EmbeddingService() {
        this.httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(TIMEOUT_SECONDS))
        .build();
        this.objectMapper = new ObjectMapper();
    }

    // PUBLIC API
    public float[] embed(String text) {

        String input = truncate(text, 512);

        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                log.debug("Embedding attempt {}/{} for text length={}", attempt, MAX_RETRIES, input.length());
                float[] result = callHuggingFace(input);
                log.debug("Embedding success - dims={}", result.length);
                return result;
            }
            catch (ModelLoadingException e) {
                // 503 = model still cold-starting on HF servers
                log.warn("HF model loading (attempt {}/{}) - waiting {}ms before retry", attempt, MAX_RETRIES, RETRY_DELAY_MS);

                if(attempt < MAX_RETRIES) {
                    sleep(RETRY_DELAY_MS);
                }
                else {
                    throw new RuntimeException("HF model failed to load after " + MAX_RETRIES + "retries", e);
                }
            }
            catch (Exception e) {
                throw new RuntimeException("Embedding call failed: " + e.getMessage(), e);
            }
        }

        throw new RuntimeException("Embedding failed after all retries");

    }

    // PRIVATE HELPERS
    @SuppressWarnings("unchecked")
    private float[] callHuggingFace(String text) throws Exception {

        String requestBody = objectMapper.writeValueAsString(Map.of("inputs", text));

        HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(HF_MODEL_URL))
        .header("Authorization", "Bearer " + apiKey)
        .header("Content-Type", "application/json")
        .timeout(Duration.ofSeconds(TIMEOUT_SECONDS))
        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
        .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        int statusCode = response.statusCode();
        String body = response.body();

        if(statusCode == 503) {
            throw new ModelLoadingException("Model loading " + body);
        }

        if(statusCode != 200) {
            throw new RuntimeException("HF API error " + statusCode + ": " + body);
        }

        // Parse response - handle both flat [float] and nested [[float]] formats
        Object parsed = objectMapper.readValue(body, Object.class);
        List<Double> values;

        if(parsed instanceof List<?> outer) {
            if(!outer.isEmpty() && outer.get(0) instanceof List) {
                // Nested format [[...]] - unwrap one level
                values = (List<Double>) outer.get(0);
            }
            else {
                // Flat format [...]
                values = (List<Double>) outer;
            }
        }
        else {
            throw new RuntimeException("Unexpected HF response format: " + body);
        }

        // Validate dimension - must be 384 for all-MiniLM-L6-v2
        if(values.size() != 384) {
            throw new RuntimeException("Expected 384-dim embedding but got " + values.size() + " - check model URL or schema vector size");
        }

        // Convert List<Double> -> float[]
        float[] embedding = new float[values.size()];
        for (int i = 0; i < values.size(); i++) {
            embedding[i] = values.get(i).floatValue();
        }

        return embedding;

    }

    private String truncate(String text, int maxTokens) {

        int maxChars = maxTokens * 4;
        if (text.length() <= maxChars) return text;
        log.warn("Text truncated from {} to {} chars for embedding", text.length(), maxChars);
        return text.substring(0, maxChars);

    }

    private void sleep(int ms) {

        try {
            Thread.sleep(ms);
        }
        catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

    }

    private static class ModelLoadingException extends Exception {
        
        public ModelLoadingException(String message) {
            super(message);
        }

    }

}
