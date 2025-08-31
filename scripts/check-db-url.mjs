// Lightweight DB URL sanity check that NEVER crashes the process.
// It only warns to logs if the URL looks wrong.
const url = process.env.DATABASE_URL || "";
const prefixOk = url.startsWith("postgresql://") || url.startsWith("postgres://");

console.log(`DATABASE_URL (raw): ${JSON.stringify(url)}`);

if (!prefixOk) {
  console.warn("WARN: DATABASE_URL does not start with postgres:// or postgresql://. Proceeding anyway.");
  process.exitCode = 0; // ensure no crash
} else {
  console.log("DB URL check passed.");
}
