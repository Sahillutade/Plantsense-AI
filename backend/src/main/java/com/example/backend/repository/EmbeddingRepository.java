package com.example.backend.repository;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.example.backend.dto.ChunkSearchResult;

@Repository
public class EmbeddingRepository {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingRepository.class);

    private static final int TOP_K = 5;

    private final JdbcTemplate jdbcTemplate;

    public EmbeddingRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // WRITE - store embedding for a chunk
    public void saveEEmbedding(Long chunkId, float[] embedding) {

        String vectorLiteral = toVectorLiteral(embedding);

        // UPDATE with explicit ::vector cast - required by pgvector
        String sql = """
            UPDATE document_chunks
            SET embedding = ?::vector
            WHERE id = ?
        """;

        int updated = jdbcTemplate.update(sql, vectorLiteral, chunkId);

        if(updated == 0){
            log.warn("saveEmbedding: no row updated for chunkId={}", chunkId);
        }
        else{
            log.debug("Embedding saved for chunkId={}", chunkId);
        }

    }

    // READ - similarity search
    public List<ChunkSearchResult> similaritySearch(float[] queryEmbedding) {

        String vectorLiteral = toVectorLiteral(queryEmbedding);

        String sql = """
            SELECT dc.id AS chunk_id,
            dc.chunk_text AS chunk_text,
            dc.chunk_index AS chunk_index,
            d.id AS document_id,
            d.filename AS filename,
            d.doc_type AS doc_type,
            1 - (dc.embedding <=> ?::vector) AS similarity_score
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE dc.embedding IS NOT NULL
            AND 1 - (dc.embedding <=> ?::vector) >= 0.25
            ORDER BY dc.embedding <=> ?::vector
            LIMIT ?        
        """;     // changed WHERE dc.embedding <=> ?::vector \n LIMIT ? to WHERE dc.embedding IS NOT NULL \n ORDER BY dc.embedding <=> ?::vector

        List<ChunkSearchResult> results = jdbcTemplate.query(
            sql,
            (rs, rowNum) -> new ChunkSearchResult(
                rs.getLong("chunk_id"),
                rs.getString("chunk_text"),
                rs.getInt("chunk_index"),
                rs.getLong("document_id"),
                rs.getString("filename"),
                rs.getString("doc_type"),
                rs.getDouble("similarity_score")
            ),
            vectorLiteral,
            vectorLiteral,
            vectorLiteral,
            TOP_K
        );

        log.debug("Similarity search returned {} chunks", results.size());
        results.forEach(r -> log.debug("chunk_id={} filename={} score={}", r.chunkId(), r.filename(), String.format("%.4f", r.similarityScore())));

        return results;

    }

    public List<ChunkSearchResult> similaritySearch(float[] queryEmbedding, int topK) {
        String vectorLiteral = toVectorLiteral(queryEmbedding);
 
        String sql = """
            SELECT
                dc.id  AS chunk_id,
                dc.chunk_text AS chunk_text,
                dc.chunk_index AS chunk_index,
                d.id AS document_id,
                d.filename AS filename,
                d.doc_type AS doc_type,
                1 - (dc.embedding <=> ?::vector) AS similarity_score
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE dc.embedding IS NOT NULL             
            ORDER BY dc.embedding <=> ?::vector
            LIMIT ?
            """;           
  
        return jdbcTemplate.query(
            sql,
            (rs, rowNum) -> new ChunkSearchResult(
                rs.getLong("chunk_id"),
                rs.getString("chunk_text"),
                rs.getInt("chunk_index"),
                rs.getLong("document_id"),
                rs.getString("filename"),
                rs.getString("doc_type"),
                rs.getDouble("similarity_score")
            ),
            vectorLiteral,
            vectorLiteral,
            topK
        );
    }

    // UTILITY
    private String toVectorLiteral(float[] embedding) {
        StringBuilder sb = new StringBuilder("[");
        for(int i = 0; i < embedding.length; i++) {
            sb.append(String.format("%.6f", embedding[i]));
            if(i < embedding.length - 1) sb.append(",");
        }

        sb.append("]");
        return sb.toString();
    }

}
