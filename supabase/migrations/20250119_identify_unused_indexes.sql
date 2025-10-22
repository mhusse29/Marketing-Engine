-- Security Audit Fix Part 5: Identify Unused Indexes for Cleanup
-- This migration provides queries to identify and document unused indexes
-- DO NOT run the cleanup automatically - review first!

-- ============================================================================
-- Query to identify unused or rarely used indexes
-- ============================================================================

-- Create a temporary view to analyze index usage
CREATE OR REPLACE VIEW v_index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    pg_relation_size(indexrelid) as index_size_bytes,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 10 THEN 'RARELY_USED'
        WHEN idx_scan < 100 THEN 'OCCASIONALLY_USED'
        ELSE 'FREQUENTLY_USED'
    END as usage_category
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

COMMENT ON VIEW v_index_usage_stats IS 
'View to monitor index usage patterns for optimization decisions';

-- ============================================================================
-- Query to find duplicate or redundant indexes
-- ============================================================================

CREATE OR REPLACE VIEW v_duplicate_indexes AS
WITH index_columns AS (
    SELECT 
        n.nspname as schema_name,
        t.relname as table_name,
        i.relname as index_name,
        array_agg(a.attname ORDER BY x.ordinality) as columns,
        pg_relation_size(i.oid) as index_size
    FROM pg_index idx
    JOIN pg_class i ON i.oid = idx.indexrelid
    JOIN pg_class t ON t.oid = idx.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    CROSS JOIN LATERAL unnest(idx.indkey) WITH ORDINALITY AS x(attnum, ordinality)
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = x.attnum
    WHERE n.nspname = 'public'
    AND NOT idx.indisprimary
    GROUP BY n.nspname, t.relname, i.relname, i.oid
)
SELECT 
    ic1.schema_name,
    ic1.table_name,
    ic1.index_name as index_1,
    ic2.index_name as index_2,
    ic1.columns,
    pg_size_pretty(ic1.index_size) as index_1_size,
    pg_size_pretty(ic2.index_size) as index_2_size
FROM index_columns ic1
JOIN index_columns ic2 
    ON ic1.schema_name = ic2.schema_name
    AND ic1.table_name = ic2.table_name
    AND ic1.index_name < ic2.index_name
WHERE ic1.columns = ic2.columns;

COMMENT ON VIEW v_duplicate_indexes IS 
'Identifies duplicate indexes that may be candidates for removal';

-- ============================================================================
-- Query to find potentially redundant partial indexes
-- ============================================================================

CREATE OR REPLACE VIEW v_index_health_report AS
SELECT 
    schemaname,
    tablename,
    COUNT(*) as total_indexes,
    COUNT(*) FILTER (WHERE idx_scan = 0) as unused_indexes,
    COUNT(*) FILTER (WHERE idx_scan < 10) as rarely_used_indexes,
    pg_size_pretty(SUM(pg_relation_size(indexrelid))) as total_index_size,
    pg_size_pretty(SUM(pg_relation_size(indexrelid)) FILTER (WHERE idx_scan = 0)) as unused_index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY SUM(pg_relation_size(indexrelid)) DESC;

COMMENT ON VIEW v_index_health_report IS 
'Summary report of index health per table';

-- ============================================================================
-- Safe Index Cleanup Recommendations (commented out for safety)
-- ============================================================================

-- IMPORTANT: Review these recommendations before executing!
-- DO NOT uncomment and run without careful analysis of your workload

/*
-- Example: Drop unused indexes (REVIEW FIRST!)
-- Uncomment only after verifying these indexes are truly unused

-- Check for automatically created indexes that might be redundant
SELECT 
    'DROP INDEX IF EXISTS ' || indexname || ';' as drop_statement,
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND idx_scan = 0
AND NOT indexname LIKE '%_pkey'
AND NOT indexname LIKE '%_unique'
ORDER BY pg_relation_size(indexrelid) DESC;

*/

-- ============================================================================
-- Index Monitoring Function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_index_recommendations()
RETURNS TABLE(
    recommendation_type text,
    table_name text,
    index_name text,
    reason text,
    potential_savings text,
    risk_level text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    RETURN QUERY
    -- Find completely unused indexes
    SELECT 
        'DROP_UNUSED'::text as recommendation_type,
        pui.tablename::text,
        pui.indexname::text,
        'Index has never been used since last statistics reset'::text as reason,
        pg_size_pretty(pg_relation_size(pui.indexrelid))::text as potential_savings,
        CASE 
            WHEN pg_relation_size(pui.indexrelid) > 100*1024*1024 THEN 'LOW'
            ELSE 'VERY_LOW'
        END::text as risk_level
    FROM pg_stat_user_indexes pui
    WHERE pui.schemaname = 'public'
    AND pui.idx_scan = 0
    AND pui.indexname NOT LIKE '%_pkey'
    AND pui.indexname NOT LIKE '%_unique%'
    
    UNION ALL
    
    -- Find rarely used large indexes
    SELECT 
        'REVIEW_RARELY_USED'::text,
        pui.tablename::text,
        pui.indexname::text,
        'Index used ' || pui.idx_scan || ' times but consumes significant space'::text,
        pg_size_pretty(pg_relation_size(pui.indexrelid))::text,
        'MEDIUM'::text
    FROM pg_stat_user_indexes pui
    WHERE pui.schemaname = 'public'
    AND pui.idx_scan > 0 
    AND pui.idx_scan < 10
    AND pg_relation_size(pui.indexrelid) > 10*1024*1024
    
    ORDER BY 
        CASE recommendation_type
            WHEN 'DROP_UNUSED' THEN 1
            WHEN 'REVIEW_RARELY_USED' THEN 2
        END;
END;
$$;

COMMENT ON FUNCTION get_index_recommendations IS 
'Provides actionable recommendations for index cleanup with risk assessment';

-- ============================================================================
-- Usage Instructions
-- ============================================================================

COMMENT ON SCHEMA public IS 
'Index optimization views and functions created. 
To review:
  SELECT * FROM v_index_usage_stats WHERE usage_category = ''UNUSED'';
  SELECT * FROM v_duplicate_indexes;
  SELECT * FROM v_index_health_report;
  SELECT * FROM get_index_recommendations();

Always backup and test in non-production first!';

-- Create initial report
DO $$
DECLARE
    v_unused_count integer;
    v_unused_size bigint;
BEGIN
    SELECT 
        COUNT(*),
        SUM(pg_relation_size(indexrelid))
    INTO v_unused_count, v_unused_size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    AND idx_scan = 0
    AND indexname NOT LIKE '%_pkey';
    
    RAISE NOTICE 'Index Optimization Summary:';
    RAISE NOTICE '  Unused indexes: %', v_unused_count;
    RAISE NOTICE '  Potential space savings: %', pg_size_pretty(v_unused_size);
    RAISE NOTICE '';
    RAISE NOTICE 'Run: SELECT * FROM get_index_recommendations(); for details';
END $$;
