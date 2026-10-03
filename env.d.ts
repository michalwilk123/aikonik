// Secrets (set via .dev.vars locally, `wrangler secret put` in production).
interface CloudflareEnv {
  OPENROUTER_API_KEY: string;
  PAYLOAD_SECRET: string;
}
