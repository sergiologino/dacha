import { describe, expect, it } from "vitest";
import {
  extractRussianPhoneDigits,
  formatRussianPhoneMask,
  maskRussianPhone,
  normalizeRussianPhone,
  sanitizeSmsCode,
} from "@/lib/phone";

describe("phone utils", () => {
  it("strips +7 and 8 prefixes from russian numbers", () => {
    expect(extractRussianPhoneDigits("+7 (999) 123-45-67")).toBe("9991234567");
    expect(extractRussianPhoneDigits("8 999 123 45 67")).toBe("9991234567");
  });

  it("normalizes full russian phone numbers", () => {
    expect(normalizeRussianPhone("+7 (999) 123-45-67")).toBe("+79991234567");
    expect(normalizeRussianPhone("9991234567")).toBe("+79991234567");
  });

  it("formats partial and complete masks", () => {
    expect(formatRussianPhoneMask("99912")).toBe("+7 (999) 12");
    expect(formatRussianPhoneMask("9991234567")).toBe("+7 (999) 123-45-67");
  });

  it("masks normalized phones for UI messages", () => {
    expect(maskRussianPhone("+79991234567")).toBe("+7 (999) 123-45-67");
  });

  it("sanitizes one-time codes", () => {
    expect(sanitizeSmsCode("12-34a56")).toBe("123456");
  });
});
