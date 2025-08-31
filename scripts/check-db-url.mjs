#!/usr/bin/env node

const raw = process.env.DATABASE_PUBLIC_URL;
console.log("DATABASE_PUBLIC_URL (raw):", JSON.stringify(raw));

if(raw){
  console.log("DATABASE_PUBLIC_URL (spaces collapsed):", JSON.stringify(raw.replace(/\s+/g," ")));
  if(!/^postgres(ql)?:\/\//.test(raw.trim())){
    console.error("FATAL: DATABASE_PUBLIC_URL does not start with postgres:// or postgresql://");
    process.exit(1);
  } else {
    console.log("OK: DATABASE_PUBLIC_URL format looks valid.");
  }
}else{
  console.error("FATAL: DATABASE_PUBLIC_URL is undefined");
  process.exit(1);
}
