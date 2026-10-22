import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { QR_QUIET_ZONE, toQrSvgPath } from "./qr";

const URL_TEXT = "https://www.housyspace.com/es/venta/piso-en-venta-en-barcelona-1001";

describe("toQrSvgPath", () => {
  const qr = toQrSvgPath(URL_TEXT);
  const reference = QRCode.create(URL_TEXT, { errorCorrectionLevel: "M" }).modules;

  it("encodes the text into a square module grid", () => {
    expect(qr.size).toBe(reference.size);
    expect(qr.size).toBeGreaterThanOrEqual(21);
  });

  it("draws exactly one unit square per dark module, at its position", () => {
    const squares = [...qr.path.matchAll(/M(\d+) (\d+)h1v1h-1z/g)];
    const dark = [...reference.data].filter((module) => module === 1).length;
    expect(squares).toHaveLength(dark);
    for (const [, x, y] of squares) {
      expect(reference.get(Number(y), Number(x))).toBe(1);
    }
  });

  it("reserves the quiet zone scanners need around the code", () => {
    expect(QR_QUIET_ZONE).toBeGreaterThanOrEqual(4);
    expect(qr.viewBox).toBe(
      `${-QR_QUIET_ZONE} ${-QR_QUIET_ZONE} ${qr.size + 2 * QR_QUIET_ZONE} ${qr.size + 2 * QR_QUIET_ZONE}`,
    );
  });
});
