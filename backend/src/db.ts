import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "drivora",
  user: "postgres",
  password: "drivora123",
});

export default pool;