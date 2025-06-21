DO $$
DECLARE
    seq RECORD;
BEGIN
    FOR seq IN
        SELECT pg_class.relname AS sequence_name,
               pg_namespace.nspname AS schema_name,
               t.relname AS table_name,
               a.attname AS column_name
        FROM pg_class
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        JOIN pg_depend ON pg_depend.objid = pg_class.oid
        JOIN pg_class t ON pg_depend.refobjid = t.oid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = pg_depend.refobjsubid
        WHERE pg_class.relkind = 'S'
          AND pg_namespace.nspname = 'public'
    LOOP
        EXECUTE format(
            'SELECT setval(%I, COALESCE((SELECT MAX(%I) FROM %I), 1))',
            seq.sequence_name, seq.column_name, seq.table_name
        );
    END LOOP;
END
$$;
