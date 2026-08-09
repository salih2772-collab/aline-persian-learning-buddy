/**
 * Model used for all Aline AI calls.
 * Deliberately NOT a ":free" OpenRouter model — free tiers are aggressively
 * rate-limited and were the main cause of failed replies.
 */
export const AI_MODEL = "openai/gpt-4.1-mini";
