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

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class EmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingService.class);

    private static final String COHERE_API_URL = "https://api.cohere.com/v1/embed";

    private static final String COHERE_MODEL = "embed-english-light-v3.0";

    @Value("${cohere.api.key}")
    private String apiKey;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public EmbeddingService() {
        this.httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(30))
        .build();
        this.objectMapper = new ObjectMapper();
    }

    // PUBLIC API
    public float[] embed(String text) {

        try {
            log.debug("Generating embedding for text length={}", text.length());

            // Cohere requires input_type — use search_query for queries,
            // search_document for chunks. We use search_query for both
            // since we're doing symmetric search on small corpus.
            Map<String, Object> requestBody = Map.of(
                "texts", List.of(truncate(text, 512)),
                "model", COHERE_MODEL,
                "input_type", "search_query",
                "embedding_types", List.of("float")
            );

            String jsonBody = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(COHERE_API_URL))
            .header("Authorization", "Bearer " + apiKey)
            .header("Content-Type", "application/json")
            .header("Accept", "application/json")
            .timeout(Duration.ofSeconds(30))
            .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
            .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Cohere API error {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("Cohere API error: " + response.statusCode());
            }

            // Parse response
            // Response shape: { "embeddings": { "float": [[0.023, -0.104, ...]] } }
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode floatArray = root.path("embeddings").path("float").get(0);

            if (floatArray == null || !floatArray.isArray()) {
                throw new RuntimeException("Unexpected Cohere response: "+ response.body());
            }

            float[] embedding = new float[floatArray.size()];
            for(int i = 0; i < floatArray.size(); i++) {
                embedding[i] = floatArray.get(i).floatValue();
            }

            log.debug("Embedding generated - dims={}", embedding.length);
            return embedding;
        }
        catch (Exception e) {
            throw new RuntimeException("Embedding call failed: " + e.getMessage(), e);
        }

    }

    // PRIVATE HELPERS
    private String truncate(String text, int maxTokens) {

        int maxChars = maxTokens * 4;
        if (text.length() <= maxChars) return text;
        log.warn("Text truncated from {} to {} chars for embedding", text.length(), maxChars);
        return text.substring(0, maxChars);

    }

}
