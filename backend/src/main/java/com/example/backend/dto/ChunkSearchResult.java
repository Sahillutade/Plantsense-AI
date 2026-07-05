package com.example.backend.dto;

public record ChunkSearchResult(Long chunkId, String chunkText, int chunkIndex, Long documentId, String filename, String docType, double similarityScore) {

    public String confidenceLabel() {
        if (similarityScore >= 0.75) return "High";
        if (similarityScore >= 0.50) return "Medium";
        return "Low";
    }

    public String citationLabel() {
        return filename + " - chunk " + chunkIndex;
    }

} 
