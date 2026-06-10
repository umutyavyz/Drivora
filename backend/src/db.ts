import { Pool } from "pg";

const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || "drivora",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "drivora123",
});

export default pool;
