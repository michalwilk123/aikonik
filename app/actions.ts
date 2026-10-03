"use server";

import type { SupportAnswer } from "@/domain/support-offer";
import { findSupport } from "@/infrastructure/container";

export async function askAssistant(query: string): Promise<SupportAnswer> {
  return findSupport(query);
}
