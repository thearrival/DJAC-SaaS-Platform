import pg from "pg";

const pool = new pg.Pool({
  connectionString: "postgresql://postgres.gcsoeumdjrejfxuovfcw:XPAPA4MdNCYFfYSo@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres",
  max: 1,
});

try {
  const tables = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
  );
  console.log("Tables:", tables.rows.map((t) => t.table_name).join(", "));
  console.log("Table count:", tables.rows.length);

  const enums = await pool.query(
    "SELECT t.typname FROM pg_type t JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e' ORDER BY t.typname"
  );
  console.log("Enums:", enums.rows.map((e) => e.typname).join(", "));
  console.log("Enum count:", enums.rows.length);

  await pool.end();
} catch (err) {
  console.error(err.message);
  await pool.end();
}
