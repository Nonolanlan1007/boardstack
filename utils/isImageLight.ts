export default async function isImageLight(imageUrl: string): Promise<boolean> {
  if (!import.meta.client) return Promise.resolve(false);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Unable to create canvas context"));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0, img.width, img.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4)
        totalBrightness +=
          0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

      const averageBrightness = totalBrightness / (data.length / 4);

      resolve(averageBrightness > 127);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = imageUrl;
  });
}
