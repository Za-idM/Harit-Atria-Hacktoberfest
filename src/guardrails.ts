const DOSAGE = /\b\d+(?:\.\d+)?\s*(?:ml|litre|liter|l\b|g\b|kg\b|gram)/i;
const PESTICIDE =
  /(pesticide|insecticide|fungicide|weedicid|herbicide|chemical|spray)/i;
const DISCLAIMER =
  /(kvk|krishi vigyan|agriculture officer|extension officer|confirm|verify|expert)/i;

const SAFETY_FOOTER =
  "\n\n⚠️ Before spraying, confirm the exact product and dosage with your nearest KVK or agriculture officer.";

let flaggedCount = 0;

export interface SafetyResult {
  text: string;
  flagged: boolean;
}

export function enforceSafety(reply: string): SafetyResult {
  if (PESTICIDE.test(reply) && DOSAGE.test(reply) && !DISCLAIMER.test(reply)) {
    flaggedCount += 1;
    console.warn(
      `[guardrails] reply gave pesticide numbers without expert advisory; appended footer.`
    );
    return { text: reply + SAFETY_FOOTER, flagged: true };
  }
  return { text: reply, flagged: false };
}

export function getFlaggedCount(): number {
  return flaggedCount;
}
