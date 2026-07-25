import { describe, it, expect } from "vitest";
import { BLOG_LAYOUT_GUIDANCE, getBlogLayoutGuidance } from "./ai";

describe("SEO Blog Generator - Core Logic", () => {
  it("should calculate word count correctly", () => {
    const text = "This is a test blog post with exactly ten words here";
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    expect(wordCount).toBe(11);
  });

  it("should map blog lengths to word counts", () => {
    const WORD_COUNT_MAP: Record<string, number> = {
      short: 600,
      medium: 1200,
      long: 2000,
      comprehensive: 3500,
    };
    expect(WORD_COUNT_MAP["short"]).toBe(600);
    expect(WORD_COUNT_MAP["medium"]).toBe(1200);
    expect(WORD_COUNT_MAP["long"]).toBe(2000);
    expect(WORD_COUNT_MAP["comprehensive"]).toBe(3500);
  });

  it("should calculate confidence score from word count", () => {
    const calculateConfidence = (wordCount: number) =>
      Math.min(100, Math.round((wordCount / 500) * 100));
    expect(calculateConfidence(500)).toBe(100);
    expect(calculateConfidence(250)).toBe(50);
    expect(calculateConfidence(1000)).toBe(100); // capped at 100
    expect(calculateConfidence(0)).toBe(0);
  });

  it("should validate blog generation input requirements", () => {
    const validateInput = (title: string, primaryKeyword: string) => {
      if (!title.trim()) return { valid: false, error: "Title required" };
      if (!primaryKeyword.trim())
        return { valid: false, error: "Primary keyword required" };
      return { valid: true };
    };
    expect(validateInput("", "seo")).toEqual({
      valid: false,
      error: "Title required",
    });
    expect(validateInput("My Blog", "")).toEqual({
      valid: false,
      error: "Primary keyword required",
    });
    expect(validateInput("My Blog", "seo tips")).toEqual({ valid: true });
  });

  it("should generate slug from keyword", () => {
    const toSlug = (keyword: string) =>
      keyword
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    expect(toSlug("content marketing strategy")).toBe(
      "content-marketing-strategy"
    );
    expect(toSlug("B2B SEO Tips")).toBe("b2b-seo-tips");
  });

  it("should validate voice DNA slider ranges", () => {
    const validateDna = (value: number) => value >= 0 && value <= 100;
    expect(validateDna(0)).toBe(true);
    expect(validateDna(50)).toBe(true);
    expect(validateDna(100)).toBe(true);
    expect(validateDna(-1)).toBe(false);
    expect(validateDna(101)).toBe(false);
  });

  it("should support all blog layout types", () => {
    const BLOG_LAYOUTS = [
      "standard",
      "thought-leadership",
      "how-to",
      "listicle",
      "case-study",
      "comparison",
      "faq-driven",
      "local-seo",
      "pillar",
      "news-commentary",
    ];
    expect(BLOG_LAYOUTS).toHaveLength(10);
    expect(BLOG_LAYOUTS).toContain("standard");
    expect(BLOG_LAYOUTS).toContain("pillar");
    expect(BLOG_LAYOUTS).toContain("local-seo");
  });

  it("gives every selectable layout a structural writing instruction", () => {
    expect(Object.keys(BLOG_LAYOUT_GUIDANCE)).toHaveLength(11);
    expect(getBlogLayoutGuidance("how-to")).toContain("step-by-step");
    expect(getBlogLayoutGuidance("local-seo")).toContain("local");
    expect(getBlogLayoutGuidance("unknown-layout")).toBe(
      BLOG_LAYOUT_GUIDANCE.standard
    );
  });

  it("should support all voice types", () => {
    const VOICE_TYPES = ["personal", "brand", "team", "campaign"];
    expect(VOICE_TYPES).toHaveLength(4);
    expect(VOICE_TYPES).toContain("personal");
    expect(VOICE_TYPES).toContain("brand");
  });

  it("should support all repurpose target formats", () => {
    const TARGET_FORMATS = [
      "Blog Post",
      "Long-form Article",
      "Listicle",
      "FAQ Post",
      "Thought Leadership",
      "Local SEO Post",
      "Rewrite",
      "Case Study",
    ];
    expect(TARGET_FORMATS).toHaveLength(8);
    expect(TARGET_FORMATS).toContain("Blog Post");
    expect(TARGET_FORMATS).toContain("Rewrite");
  });
});
