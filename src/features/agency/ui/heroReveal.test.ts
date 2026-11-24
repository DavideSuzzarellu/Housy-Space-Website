import { describe, expect, it, vi } from "vitest";
import { afterPaintedFrames, type FrameSource } from "./heroReveal";

/** A fake video whose frames are painted by hand. */
function fakeVideo() {
  let pending: (() => void) | undefined;
  const source: FrameSource = {
    requestVideoFrameCallback: (callback) => {
      pending = () => callback();
      return 1;
    },
  };
  const paint = (): void => {
    const run = pending;
    pending = undefined;
    run?.();
  };
  return { source, paint };
}

describe("afterPaintedFrames", () => {
  it("waits for the requested number of painted frames", () => {
    const { source, paint } = fakeVideo();
    const done = vi.fn();
    afterPaintedFrames(source, 4, done);
    paint();
    paint();
    paint();
    expect(done).not.toHaveBeenCalled();
    paint();
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("falls back to a timeout when requestVideoFrameCallback is missing", () => {
    vi.useFakeTimers();
    const done = vi.fn();
    afterPaintedFrames({}, 4, done);
    vi.advanceTimersByTime(249);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(done).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
