// Thumbnail generation worker
self.onmessage = async (e) => {
  const { file, TARGET_W, TARGET_H, QUALITY } = e.data;
  const type = file.type;

  try {
    if (type.startsWith("image/")) {
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      const ratio = Math.min(TARGET_W / width, TARGET_H / height);
      const w = Math.round(width * ratio);
      const h = Math.round(height * ratio);

      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(bitmap, 0, 0, w, h);
      
      const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: QUALITY });
      const reader = new FileReader();
      reader.onloadend = () => {
        self.postMessage({ thumb: reader.result });
      };
      reader.readAsDataURL(blob);
      bitmap.close();
    } else {
      // For video, we still need the main thread for now because 
      // OffscreenCanvas doesn't support <video> yet in all browsers 
      // and VideoDecoder is more complex.
      self.postMessage({ error: "Unsupported type in worker" });
    }
  } catch (err) {
    self.postMessage({ error: err.message });
  }
};
