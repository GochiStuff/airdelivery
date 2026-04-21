export async function generateThumbnail(file: File): Promise<string> {
  const type = file.type;
  const TARGET_W = 1280;
  const TARGET_H = 720;
  const QUALITY = 0.7;

  // Use worker for images
  if (type.startsWith("image/")) {
    return new Promise((resolve) => {
      const worker = new Worker("/thumbnail.worker.js");
      worker.onmessage = (e) => {
        if (e.data.thumb) resolve(e.data.thumb);
        else resolve("");
        worker.terminate();
      };
      worker.onerror = () => {
        resolve("");
        worker.terminate();
      };
      worker.postMessage({ file, TARGET_W, TARGET_H, QUALITY });
    });
  }

  // Fallback to main thread for video (OffscreenCanvas lacks <video> support)
  if (type.startsWith("video/")) {
    return new Promise<string>((res, rej) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 1; 

      const cleanup = () => {
        URL.revokeObjectURL(video.src);
        video.onloadeddata = null;
        video.onerror = null;
      };

      video.onloadeddata = () => {
        try {
          const { videoWidth, videoHeight } = video;
          const ratio = Math.min(TARGET_W / videoWidth, TARGET_H / videoHeight);
          const w = Math.round(videoWidth * ratio);
          const h = Math.round(videoHeight * ratio);

          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d")!.drawImage(video, 0, 0, w, h);
          const thumb = canvas.toDataURL("image/jpeg", QUALITY);
          cleanup();
          res(thumb);
        } catch (e) {
          cleanup();
          res("");
        }
      };
      video.onerror = () => {
        cleanup();
        res("");
      };
    });
  }

  return "";
}
