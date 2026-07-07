package com.example.backend.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.backend.dto.ChatResponse;
import com.example.backend.dto.ChunkSearchResult;
import com.example.backend.model.WorkOrder;
import com.example.backend.repository.EmbeddingRepository;
import com.example.backend.repository.WorkOrderRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class RagService {

    private static final Logger log = LoggerFactory.getLogger(RagService.class);

    // Groq API endpoint - OpenAI-compatible format
    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

    // Model - llama-3.1-8b-instant is fast and free on Groq
    private static final String GROQ_MODEL = "llama-3.1-8b-instant";

    // Max tokens for LLM answer 
    private static final int MAX_TOKENS = 512;

    // Excerpt length shown in source citation cards in the UI
    private static final int EXCERPT_LENGTH = 300;

    // Equipment tags for entity detection in user queries
    private static final List<String> EQUIPMENT_TAGS = List.of(
        "P-204", "P-101", "C-301", "V-12", "V-22", "HX-205", "T-410", "M-115"
    );

    private static final Pattern EQUIPMENT_PATTERN = Pattern.compile(
        EQUIPMENT_TAGS.stream().map(Pattern::quote).collect(Collectors.joining("|")), Pattern.CASE_INSENSITIVE
    );

    @Value("${groq.api.key}")
    private String groqApiKey;

    private final EmbeddingService embeddingService;
    private final EmbeddingRepository embeddingRepository;
    private final WorkOrderRepository workOrderRepository;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public RagService(String groqApiKey, EmbeddingService embeddingService, EmbeddingRepository embeddingRepository,
            WorkOrderRepository workOrderRepository, ObjectMapper objectMapper) {
        this.groqApiKey = groqApiKey;
        this.embeddingService = embeddingService;
        this.embeddingRepository = embeddingRepository;
        this.workOrderRepository = workOrderRepository;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(30)).build();
        this.objectMapper = objectMapper;
    }

    // PUBLIC API
    public ChatResponse answer(String question, String sessionId) {

        log.info("RAG query: '{}'", question);

        // STEP 1 - Embed the query
        float[] queryEmbedding = embeddingService.embed(question);

        // STEP 2 - Smimilarity search - top-5 chunks
        List<ChunkSearchResult> chunks = embeddingRepository.similaritySearch(queryEmbedding);
        
        if (chunks.isEmpty()) {
            log.warn("No chunks retrieved for query - returning fallback response");
            return fallbackResponse(sessionId);
        }

        // STEP 3 - Entity detection - equipment tags in question
        List<String> detectedTags = detectEquipmentTags(question);
        log.info("Detected equipment tags: {}", detectedTags);

        // STEP 4 - Structured lookup - work orders for detected equipments
        List<WorkOrder> workOrders = fetchWorkOrders(detectedTags);

        // STEP 5 - Build context window
        String context = buildContext(chunks, workOrders);

        // STEP 6 - Call Groq LLM
        String answer = callGroq(question, context);

        // STEP 7 - Build response
        String confidence = chunks.get(0).confidenceLabel();
        List<ChatResponse.Source> sources = buildSources(chunks);

        log.info("RAG complete - confidence={}, sources={}", confidence, sources.size());
        return new ChatResponse(answer, confidence, sources, sessionId);

    }

    // STEP 3 - ENTITY DETECTION
    private List<String> detectEquipmentTags(String question) {

        List<String> found = new ArrayList<>();
        Matcher matcher = EQUIPMENT_PATTERN.matcher(question);
        while (matcher.find()) {
            String tag = matcher.group().toUpperCase();
            if (!found.contains(tag)) {
                found.add(tag);
            }
        }

        return found;

    }

    // STEP 4 - STRUCTURED WORK ORDER LOOKUP
    private List<WorkOrder> fetchWorkOrders(List<String> tags) {

        List<WorkOrder> all = new ArrayList<>();

        for(String tag : tags) {
            List<WorkOrder> orders = workOrderRepository.findByEquipmentEquipmentTagOrderByDateOpenedDesc(tag);
            all.addAll(orders.stream().limit(5).toList());
        }

        return all;

    }

    // STEP 5 - BUILD CONTEXT WINDOW
    private String buildContext(List<ChunkSearchResult> chunks, List<WorkOrder> workOrders) {

        StringBuilder ctx = new StringBuilder();

        ctx.append("[DOCUMENT EXCERPTS]\n");
        for(int i = 0; i < chunks.size(); i++) {
            ChunkSearchResult c = chunks.get(i);
            ctx.append(String.format("Source %d: %s (%s)\n", i+1, c.filename(), c.docType()));
            ctx.append(c.chunkText()).append("\n---\n"); 
        }

        // Structured maintenanace history section
        if (!workOrders.isEmpty()) {
            ctx.append("\n[MAINTENANCE HISTORY]\n");
            ctx.append("Id | Equipment | Date | Type | Description | Root Cause\n");
            for(WorkOrder wo : workOrders) {
                ctx.append(String.format("%s | %s | %s | %s | %s | %s\n", 
                    wo.getWorkOrderId(),
                    wo.getEquipment().getEquipmentTag(),
                    wo.getDateOpened(),
                    wo.getType(),
                    wo.getDescription(),
                    wo.getRootCause() != null ? wo.getRootCause() : "N/A"
                ));
            }
        } 

        return ctx.toString();

    }

    // STEP 6 - GROQ LLM CALL
    private String callGroq(String question, String context) {

        try {
            String systemPrompt = """
                You are Plantsense AI, an industrial knowledge intelligence assistant for plant operations and maintenance teams.
                
                You answer questions STRICTLY based on the context provided below.

                The context contains document excerpts from SOPs, inspection reports, incident reports, OEM manuals, and compliance certificates, as well as structured maintenance work order history.

                Rules:
                1. Answer only from the provided context. Do not use outside knowledge.
                2. If the answer is not in the context, say: "I could not find this information in the available documents."
                3. Always mention which document(s) your answer comes from.
                4. Be concise and precise — maintenance teams need clear, actionable answers.
                5. If the question involves a failure or incident, highlight the root cause and any recommendations.
                6. Use plain language — avoid unnecessary technical jargon.

                CONTEXT:
            """ + context;

            // Build Groq request body - OpenAI-compatible format
            Map<String, Object> requestBody = Map.of("model", GROQ_MODEL, "max_tokens", MAX_TOKENS, "temperature", 0.2, "messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", question)
            ));
            
            String jsonBody = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(GROQ_API_URL))
            .header("Authorization", "Bearer " + groqApiKey)
            .header("Content-Type", "application/json")
            .timeout(Duration.ofSeconds(30))
            .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
            .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Groq API error {}: {}", response.statusCode(), response.body());
                return "I encountered an error generating the answer. Please try again.";
            }

            // Parse response - extract content from choices[0].message.content
            JsonNode root = objectMapper.readTree(response.body());
            String answer = root
            .path("choices").get(0)
            .path("message")
            .path("content")
            .asText();
            
            log.info("Groq response received - length={} chars", answer.length());

            return answer;
        }
        catch (Exception e) {
            log.error("Groq call failed: {}", e.getMessage(), e);
            return "I encountered an error generating the answer. Please try again.";
        }

    }

    // STEP 7 - BUILD SOURCES LIST
    private List<ChatResponse.Source> buildSources(List<ChunkSearchResult> chunks) {

        Map<String, ChunkSearchResult> bestPerFile = new LinkedHashMap<>();
        
        for(ChunkSearchResult chunk : chunks) {
            bestPerFile.merge(
                chunk.filename(),
                chunk,
                (existing, incoming) -> incoming.similarityScore() > existing.similarityScore() ? incoming : existing
            );
        }

        return bestPerFile.values().stream()
        .map(c -> new ChatResponse.Source(
            c.filename(),
            c.docType(),
            c.chunkIndex(),
            excerpt(c.chunkText()),
            Math.round(c.similarityScore() * 10000.0) / 10000.0
        ))
        .collect(Collectors.toList());

    }

    private String excerpt(String text) {

        if(text == null || text.length() <= EXCERPT_LENGTH) return text;

        int cutAt = text.lastIndexOf(' ', EXCERPT_LENGTH);

        return text.substring(0, cutAt > 0 ? cutAt : EXCERPT_LENGTH) + "...";

    }

    // FALLBACK
    private ChatResponse fallbackResponse(String sessionId) {

        return new ChatResponse(
            "I could not find relevant information in the available documents for your query. " + 
            "Please try rephrasing or ask about a specific equipment tag or procedure.",
            "Low",
            Collections.emptyList(),
            sessionId
        );

    }

}
