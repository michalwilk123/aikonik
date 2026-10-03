// Secrets (set via .dev.vars locally, `wrangler secret put` in production).
interface CloudflareEnv {
  DEV?: string;
  OPENROUTER_API_KEY: string;
  PAYLOAD_SECRET: string;
}
