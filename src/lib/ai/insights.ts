import { Codex } from "@openai/codex-sdk";
import { AIInsight, Fixture, ProbabilityBundle } from "@/lib/types";

const DEFAULT_MODEL = "gpt-5.3-codex";
const CODEX_TIMEOUT_MS = 8_000;
const AI_INSIGHT_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    keySignals: {
      type: "array",
      items: { type: "string" },
      maxItems: 5
    },
    riskFlags: {
      type: "array",
      items: { type: "string" },
      maxItems: 5
    },
    valueNotes: {
      type: "array",
      items: { type: "string" },
      maxItems: 5
    }
  },
  required: ["summary", "keySignals", "riskFlags", "valueNotes"],
  additionalProperties: false
} as const;

export function fallbackInsight(fixture: Fixture, probabilities: ProbabilityBundle): AIInsight {
  const top = [...probabilities.markets].sort((a, b) => b.percent - a.percent).slice(0, 3);

  return {
    summary: `${fixture.home.name} vs ${fixture.away.name} has the clearest signals around ${top
      .map((item) => item.selection.toLowerCase())
      .join(", ")}. Treat this as a research view, not a guaranteed outcome.`,
    keySignals: top.map((item) => `${item.selection}: ${item.percent}% (${item.confidence} confidence)`),
    riskFlags: [
      "Football outcomes are volatile and can change with lineups, injuries, weather, and late tactical news.",
      ...probabilities.warnings
    ],
    valueNotes: [
      "Compare these model percentages with bookmaker implied probabilities before calling anything value.",
      "Avoid markets marked low confidence unless you have an independent reason to trust the angle."
    ],
    generatedAt: new Date().toISOString(),
    provider: "fallback"
  };
}

export function parseAIInsight(text: string): Omit<AIInsight, "generatedAt" | "provider"> | undefined {
  try {
    const parsed = JSON.parse(text) as Partial<AIInsight>;
    if (
      typeof parsed.summary === "string" &&
      Array.isArray(parsed.keySignals) &&
      Array.isArray(parsed.riskFlags) &&
      Array.isArray(parsed.valueNotes)
    ) {
      return {
        summary: parsed.summary,
        keySignals: parsed.keySignals.map(String).slice(0, 5),
        riskFlags: parsed.riskFlags.map(String).slice(0, 5),
        valueNotes: parsed.valueNotes.map(String).slice(0, 5)
      };
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export async function generateAIInsight(fixture: Fixture, probabilities: ProbabilityBundle): Promise<AIInsight> {
  const useCodex = Boolean(process.env.CODEX_API_KEY || process.env.CODEX_USE_LOCAL_AUTH === "true");

  if (!useCodex) {
    return fallbackInsight(fixture, probabilities);
  }

  try {
    const codex = new Codex({
      apiKey: process.env.CODEX_API_KEY,
      config: {
        model_reasoning_effort: "low"
      }
    });
    const thread = codex.startThread({
      model: process.env.CODEX_MODEL || DEFAULT_MODEL,
      sandboxMode: "read-only",
      workingDirectory: process.cwd(),
      skipGitRepoCheck: true,
      approvalPolicy: "never",
      webSearchMode: "disabled"
    });
    const turn = await thread.run(
      [
        {
          type: "text",
          text: [
            "You are a soccer betting research assistant.",
            "Explain deterministic probabilities without guaranteeing outcomes.",
            "Return only JSON matching the schema.",
            "Do not run commands, edit files, browse the web, or invent stats.",
            "Mention missing data or low-confidence markets.",
            "Frame all advice as research, not betting certainty.",
            "Keep the summary under 40 words.",
            JSON.stringify({ fixture, probabilities })
          ].join("\n")
        }
      ],
      {
        outputSchema: AI_INSIGHT_SCHEMA,
        signal: AbortSignal.timeout(CODEX_TIMEOUT_MS)
      }
    );

    const parsed = parseAIInsight(turn.finalResponse);
    if (!parsed) {
      return fallbackInsight(fixture, probabilities);
    }

    return {
      ...parsed,
      generatedAt: new Date().toISOString(),
      provider: "codex"
    };
  } catch {
    return fallbackInsight(fixture, probabilities);
  }
}
