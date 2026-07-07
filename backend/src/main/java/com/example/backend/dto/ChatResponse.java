package com.example.backend.dto;

import java.util.List;

public record ChatResponse(String answer, String confidence, List<Source> sources, String sessionId) {

    public record Source(String filename, String docType, int chunkIndex, String excerpt, double score) {

    }

}
