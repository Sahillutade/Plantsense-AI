-- ─────────────────────────────────────────────────────────────────────────────
-- V1__init.sql
-- Vigil AI — Industrial Knowledge Intelligence Platform
-- Full schema migration
--
-- Embedding model : sentence-transformers/all-MiniLM-L6-v2 (Hugging Face)
-- Embedding dims  : 384
-- Vector index    : HNSW with cosine distance
--
-- How to use:
--   Step 1 → Run this entire file once in Supabase SQL Editor
--   Step 2 → Set spring.flyway.enabled=false in application.properties
--             (schema already exists, Flyway not needed)
--   Step 3 → Set spring.jpa.hibernate.ddl-auto=none
--             (Hibernate should not touch the schema)
--
-- To reset everything and start fresh:
--   Run the DROP section at the bottom, then re-run this file.
-- ─────────────────────────────────────────────────────────────────────────────
 
 
-- ── 0. Enable pgvector extension ──────────────────────────────────────────
-- Available by default on Supabase free tier.
-- Must run before any table that uses the vector type.
CREATE EXTENSION IF NOT EXISTS vector;
 
 
-- ── 1. documents ──────────────────────────────────────────────────────────
-- One row per ingested file.
-- raw_text stores full extracted text for chunk re-generation and citation preview.
-- doc_type is derived from filename prefix during ingestion.
CREATE TABLE IF NOT EXISTS documents (
    id            BIGSERIAL     PRIMARY KEY,
    filename      VARCHAR(255)  NOT NULL,
    doc_type      VARCHAR(50)   NOT NULL,
                                -- Allowed values:
                                -- SOP | INCIDENT | INSPECTION | COMPLIANCE
                                -- OEM_MANUAL | WORK_ORDER | EQUIPMENT | UNKNOWN
    raw_text      TEXT          NOT NULL,
    source_path   VARCHAR(500),
    uploaded_at   TIMESTAMP     NOT NULL DEFAULT NOW()
);
 
CREATE INDEX IF NOT EXISTS idx_documents_doc_type
    ON documents(doc_type);
 
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at
    ON documents(uploaded_at DESC);
 
 
-- ── 2. equipment ──────────────────────────────────────────────────────────
-- Equipment master list. equipment_tag is natural PK (e.g. "P-204").
-- Must be seeded BEFORE work_orders and entity_mentions due to FK constraints.
CREATE TABLE IF NOT EXISTS equipment (
    equipment_tag   VARCHAR(20)   PRIMARY KEY,
    equipment_type  VARCHAR(100)  NOT NULL,
    location        VARCHAR(200),
    installed_date  DATE,
    manufacturer    VARCHAR(100),
    model           VARCHAR(100),
    criticality     VARCHAR(10)
                    CHECK (criticality IN ('High', 'Medium', 'Low'))
);
 
 
-- ── 3. work_orders ────────────────────────────────────────────────────────
-- Maintenance history per equipment item.
-- work_order_id is natural PK (e.g. "WO-3381").
-- downtime_hours = 0 for planned/preventive work orders.
CREATE TABLE IF NOT EXISTS work_orders (
    work_order_id   VARCHAR(20)   PRIMARY KEY,
    equipment_tag   VARCHAR(20)   NOT NULL
                    REFERENCES equipment(equipment_tag)
                    ON DELETE RESTRICT,
    date_opened     DATE,
    date_closed     DATE,
    type            VARCHAR(20)
                    CHECK (type IN ('Preventive', 'Corrective', 'Inspection')),
    description     TEXT,
    root_cause      TEXT,
    technician      VARCHAR(100),
    downtime_hours  DECIMAL(5,1)  NOT NULL DEFAULT 0
);
 
CREATE INDEX IF NOT EXISTS idx_work_orders_equipment_tag
    ON work_orders(equipment_tag);
 
CREATE INDEX IF NOT EXISTS idx_work_orders_type
    ON work_orders(type);
 
CREATE INDEX IF NOT EXISTS idx_work_orders_date_opened
    ON work_orders(date_opened DESC);
 
 
-- ── 4. document_chunks ────────────────────────────────────────────────────
-- One row per text chunk from a parent document.
-- chunk_index is 0-based position within the document.
--
-- embedding is vector(384) matching all-MiniLM-L6-v2 output dimensions.
-- This column is NOT mapped by Hibernate — writes and similarity search
-- go through EmbeddingRepository using native JDBC SQL.
--
-- HNSW index is built here for approximate nearest-neighbour search.
-- cosine distance (<=> operator) is standard for normalised text embeddings.
CREATE TABLE IF NOT EXISTS document_chunks (
    id            BIGSERIAL     PRIMARY KEY,
    document_id   BIGINT        NOT NULL
                  REFERENCES documents(id)
                  ON DELETE CASCADE,
    chunk_text    TEXT          NOT NULL,
    chunk_index   INTEGER       NOT NULL,
    embedding     vector(384)
);
 
CREATE INDEX IF NOT EXISTS idx_chunks_document_id
    ON document_chunks(document_id);
 
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
    ON document_chunks
    USING hnsw (embedding vector_cosine_ops);
 
 
-- ── 5. entity_mentions ────────────────────────────────────────────────────
-- Bridge table: which equipment tags appear in which documents.
-- Populated during ingestion by regex scanning known equipment tags.
-- Powers the asset context panel — "find all documents mentioning P-204".
--
-- UNIQUE constraint on (document_id, equipment_tag) makes re-ingestion
-- idempotent — duplicate inserts are safely rejected.
CREATE TABLE IF NOT EXISTS entity_mentions (
    id              BIGSERIAL     PRIMARY KEY,
    document_id     BIGINT        NOT NULL
                    REFERENCES documents(id)
                    ON DELETE CASCADE,
    equipment_tag   VARCHAR(20)   NOT NULL
                    REFERENCES equipment(equipment_tag)
                    ON DELETE CASCADE,
    mention_context TEXT,
    UNIQUE (document_id, equipment_tag)
);
 
CREATE INDEX IF NOT EXISTS idx_entity_mentions_equipment_tag
    ON entity_mentions(equipment_tag);
 
CREATE INDEX IF NOT EXISTS idx_entity_mentions_document_id
    ON entity_mentions(document_id);
 
 
-- ── 6. chat_messages ──────────────────────────────────────────────────────
-- Persists conversation history per session.
-- session_id is a UUID generated by the frontend on page load.
-- sources_json is a JSON array of citation objects — null for user messages.
-- confidence is null for user messages, High/Medium/Low for assistant messages.
CREATE TABLE IF NOT EXISTS chat_messages (
    id            BIGSERIAL     PRIMARY KEY,
    session_id    VARCHAR(100)  NOT NULL,
    role          VARCHAR(10)   NOT NULL
                  CHECK (role IN ('user', 'assistant')),
    content       TEXT          NOT NULL,
    sources_json  TEXT,
    confidence    VARCHAR(10)
                  CHECK (confidence IN ('High', 'Medium', 'Low')),
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);
 
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id
    ON chat_messages(session_id);
 
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at
    ON chat_messages(created_at DESC);
 
 
-- ─────────────────────────────────────────────────────────────────────────────
-- REFERENCE: Similarity search query
-- Use this in EmbeddingRepository as a native JDBC query.
-- Replace :queryVector with your embedded query cast as vector.
--
-- SELECT
--     dc.id                                        AS chunk_id,
--     dc.chunk_text                                AS chunk_text,
--     dc.chunk_index                               AS chunk_index,
--     d.id                                         AS document_id,
--     d.filename                                   AS filename,
--     d.doc_type                                   AS doc_type,
--     1 - (dc.embedding <=> :queryVector::vector)  AS similarity_score
-- FROM document_chunks dc
-- JOIN documents d ON d.id = dc.document_id
-- WHERE dc.embedding IS NOT NULL
-- ORDER BY dc.embedding <=> :queryVector::vector
-- LIMIT 5;
--
-- <=>  : pgvector cosine distance operator (0 = identical, 2 = opposite)
-- 1 - distance = cosine similarity (1 = identical, -1 = opposite)
-- LIMIT 5 : top 5 most relevant chunks fed into RAG context window
-- ─────────────────────────────────────────────────────────────────────────────
 
 
-- ─────────────────────────────────────────────────────────────────────────────
-- RESET SCRIPT (run only if you need to wipe and start fresh)
-- Uncomment and run in Supabase SQL Editor, then re-run this entire file.
--
-- DROP INDEX IF EXISTS idx_chunks_embedding;
-- DROP TABLE IF EXISTS chat_messages;
-- DROP TABLE IF EXISTS entity_mentions;
-- DROP TABLE IF EXISTS document_chunks;
-- DROP TABLE IF EXISTS work_orders;
-- DROP TABLE IF EXISTS documents;
-- DROP TABLE IF EXISTS equipment;
-- DROP EXTENSION IF EXISTS vector;
-- ─────────────────────────────────────────────────────────────────────────────
