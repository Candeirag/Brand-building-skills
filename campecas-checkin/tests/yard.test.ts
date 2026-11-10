import { describe, expect, it } from "vitest";
import { formatDuration } from "@/lib/time";
import { isOverdue, yardDurationMs, YARD_ALERT_HOURS } from "@/lib/yard";

const MIN = 60_000;
const H = 60 * MIN;

describe("tempo no pátio", () => {
  it("formata a duração", () => {
    expect(formatDuration(20_000)).toBe("menos de 1 min");
    expect(formatDuration(42 * MIN)).toBe("42 min");
    expect(formatDuration(3 * H + 5 * MIN)).toBe("3 h 05 min");
    expect(formatDuration(2 * 24 * H + 4 * H + 30 * MIN)).toBe("2 d 4 h");
    expect(formatDuration(3 * 24 * H)).toBe("3 d");
    expect(formatDuration(-5 * MIN)).toBe("menos de 1 min");
  });

  it("corre até agora enquanto não há saída e para na saída", () => {
    const start = "2026-11-10T10:00:00Z";
    const now = Date.parse("2026-11-10T13:30:00Z");
    expect(yardDurationMs(start, null, now)).toBe(3.5 * H);
    expect(yardDurationMs(start, "2026-11-10T11:00:00Z", now)).toBe(H);
  });

  it("destaca depois do limite", () => {
    expect(isOverdue((YARD_ALERT_HOURS - 1) * H)).toBe(false);
    expect(isOverdue(YARD_ALERT_HOURS * H)).toBe(true);
  });
});
