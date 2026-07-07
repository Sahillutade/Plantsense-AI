package com.example.backend.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.ChatRequest;
import com.example.backend.dto.ChatResponse;
import com.example.backend.model.ChatMessage;
import com.example.backend.repository.ChatMessageRepository;
import com.example.backend.service.RagService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:5173")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final RagService ragService;
    private final ChatMessageRepository chatMessageRepository;
    private final ObjectMapper objectMapper;

    public ChatController(RagService ragService, ChatMessageRepository chatMessageRepository,
            ObjectMapper objectMapper) {
        this.ragService = ragService;
        this.chatMessageRepository = chatMessageRepository;
        this.objectMapper = objectMapper;
    }

    // POST /api/chat
    @PostMapping
    public ResponseEntity<?> chat(@RequestBody ChatRequest request) {

        // VALIDATE
        if (request.question() == null || request.question().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Question cannot be empty"));
        }

        String sessionId = (request.sessionId() != null && !request.sessionId().isBlank()) ? request.sessionId() : UUID.randomUUID().toString();

        log.info("Chat request - session={} question='{}'", sessionId, request.question());

        try {
            // RAG pipeline
            ChatResponse response = ragService.answer(request.question(), sessionId);

            // Persist conversation
            persistUserMessage(sessionId, request.question());
            persistAssistantMessage(sessionId, response);

            return ResponseEntity.ok(response);
        }
        catch (Exception e) {
            log.error("Chat endpoint error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to process query: " + e.getMessage()));
        }

    }

    // GET /api/chat/history?sessionId=<uuid>
    @GetMapping("/history")
    public ResponseEntity<?> history(@RequestParam String sessionId) {

        if(sessionId == null || sessionId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "sessionId is required"));
        }

        List<ChatMessage> messages = chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);

        List<Map<String, Object>> result = messages.stream()
        .map(m -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("role", m.getRole());
            entry.put("content", m.getContent());
            entry.put("confidence", m.getConfidence());
            entry.put("sources", parseSources(m.getSourceJson()));
            entry.put("createdAt", m.getCreatedAt().toString());
            return entry;
        })
        .toList();

        return ResponseEntity.ok(result);

    }

    // PRIVATE HELPERS
    private void persistUserMessage(String sessionId, String question) {

        ChatMessage msg = new ChatMessage();
        msg.setSessionId(sessionId);
        msg.setRole("user");
        msg.setContent(question);
        // sources and confidence are null for user messages
        chatMessageRepository.save(msg);

    }

    private void persistAssistantMessage(String sessionId, ChatResponse response) {

        ChatMessage msg = new ChatMessage();
        msg.setSessionId(sessionId);
        msg.setRole("assistant");
        msg.setContent(response.answer());
        msg.setConfidence(response.confidence());

        // Serialize sources list to JSON string for storage
        try {
            msg.setSourceJson(objectMapper.writeValueAsString(response.sources()));
        }
        catch (JsonProcessingException e) {
            log.warn("Failed to serialize sources to JSON: {}", e.getMessage());
            msg.setSourceJson("[]");
        }

        chatMessageRepository.save(msg);

    }

    private Object parseSources(String sourcesJson) {

        if(sourcesJson == null) return null;
        try {
            return objectMapper.readValue(sourcesJson, List.class);
        }
        catch (JsonProcessingException e) {
            log.warn("Failed to parse sourcesJson: {}", e.getMessage());
            return List.of();
        }

    }

}
