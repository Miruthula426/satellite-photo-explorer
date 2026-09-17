/**
 * Converts a File or Blob into base64 data URL with optional max dimension resizing
 */
export async function fileToBase64(file: File, maxDimension: number = 1920): Promise<{ dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: reader.result as string, mimeType: file.type || 'image/jpeg' });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mime, 0.92);
        resolve({ dataUrl, mimeType: mime });
      };
      img.onerror = () => {
        resolve({ dataUrl: reader.result as string, mimeType: file.type || 'image/jpeg' });
      };
      img.src = reader.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Fetches an image from a URL and converts it to base64
 */
export async function urlToBase64(url: string): Promise<{ dataUrl: string; mimeType: string }> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const blob = await res.blob();
    const file = new File([blob], 'satellite-image.jpg', { type: blob.type || 'image/jpeg' });
    return await fileToBase64(file);
  } catch (err) {
    // If CORS prevents direct fetch, load via Image object with anonymous crossOrigin
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1200;
        canvas.height = img.naturalHeight || 800;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve({ dataUrl, mimeType: 'image/jpeg' });
      };
      img.onerror = () => reject(new Error('Unable to load image from URL. Please try uploading the image file directly.'));
      img.src = url;
    });
  }
}
