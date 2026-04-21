export async function generateThumbnail(file: File): Promise<string> {
  const type = file.type;
  const TARGET_W = 1280;
  const TARGET_H = 720;
  const QUALITY = 0.7;              // JPEG quality 0–1  compression

  // helper to draw & resize
  const drawToCanvas = (videoOrImg: HTMLVideoElement | HTMLImageElement) => {
    // maintain aspect ratio
    const { videoWidth, videoHeight } =
      videoOrImg instanceof HTMLVideoElement
        ? videoOrImg
        : { videoWidth: (videoOrImg as any).naturalWidth, videoHeight: (videoOrImg as any).naturalHeight };
    const ratio = Math.min(TARGET_W / videoWidth, TARGET_H / videoHeight);
    const w = Math.round(videoWidth * ratio);
    const h = Math.round(videoHeight * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(videoOrImg, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", QUALITY);
  };

  // —— IMAGE ——  
  if (type.startsWith("image/")) {
    return new Promise<string>((res) => {
      const img = new Image();
      img.onload = () => res(drawToCanvas(img));
      img.src = URL.createObjectURL(file);
    });
  }

  // —— VIDEO ——  
  if (type.startsWith("video/")) {
    return new Promise<string>((res, rej) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = URL.createObjectURL(file);
      video.currentTime = 1; 
      video.onloadeddata = () => {
        try {
          const thumb = drawToCanvas(video);
          URL.revokeObjectURL(video.src);
          res(thumb);
        } catch (e) {
          rej(e);
        }
      };
      video.onerror = () => rej("video thumbnail failed");
    });
  }

  // —— PDF ——  
  // TODO
  // —— FALLBACK ——  
  return "";
}
