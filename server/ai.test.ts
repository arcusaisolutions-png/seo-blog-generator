import { describe, expect, it } from "vitest";
import { requireLLMContent } from "./ai";
import { ensureInvokeResult } from "./_core/llm";

describe("AI response guards", () => {
  it("extracts string and rich-text completions", () => {
    expect(
      requireLLMContent(
        { choices: [{ message: { content: "  Ready  " } }] },
        "Test"
      )
    ).toBe("Ready");
    expect(
      requireLLMContent(
        {
          choices: [{ message: { content: [{ type: "text", text: "Rich" }] } }],
        },
        "Test"
      )
    ).toBe("Rich");
  });

  it("turns an empty provider response into an actionable error", () => {
    expect(() =>
      ensureInvokeResult({
        error: { message: "Model is temporarily unavailable" },
      })
    ).toThrow("The AI service did not return a completion");
    expect(() => requireLLMContent({ choices: [] }, "Voice analysis")).toThrow(
      "Voice analysis did not return usable content"
    );
  });
});
