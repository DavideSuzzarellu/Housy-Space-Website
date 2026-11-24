/** The slice of HTMLVideoElement the gate needs (absent in older browsers). */
export interface FrameSource {
  requestVideoFrameCallback?: (callback: () => void) => number;
}

/** Without the frame API there is no way to count frames: assume they are painted by then. */
export const FRAME_FALLBACK_MS = 250;

/**
 * Calls `done` once `count` real frames have been painted, so the poster (frame 0)
 * is only swapped for a video that is already moving.
 */
export function afterPaintedFrames(video: FrameSource, count: number, done: () => void): void {
  const request = video.requestVideoFrameCallback?.bind(video);
  if (request === undefined) {
    setTimeout(done, FRAME_FALLBACK_MS);
    return;
  }
  let remaining = count;
  const onFrame = (): void => {
    remaining -= 1;
    if (remaining <= 0) done();
    else request(onFrame);
  };
  request(onFrame);
}
