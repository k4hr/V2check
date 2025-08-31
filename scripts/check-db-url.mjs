// Small helper so Railway logs show what's inside DATABASE_URL
const raw = process.env.DATABASE_URL ?? ''
console.log('DATABASE_URL (raw):', JSON.stringify(raw))

// If you use Railway variable references like ${{ Postgres.DATABASE_URL }},
// the value here won't literally start with postgres:// at build time.
// That's OK — Prisma will receive the resolved value at runtime.
if (!/^postgres(ql)?:\/\//.test(raw)) {
  console.warn('WARN: DATABASE_URL does not start with postgres:// or postgresql://. If you are using Railway references, you can ignore this warning.')
}
