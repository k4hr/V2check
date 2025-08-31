// scripts/check-db-url.mjs
const raw = process.env.DATABASE_URL || ''
console.log(`DATABASE_URL (raw): "${raw}"`)
if (!/^postgres(ql)?:\/\//.test(raw)) {
  console.warn('WARN: DATABASE_URL does not start with postgres:// or postgresql://. If you are using Railway references, you can ignore this warning.')
}
