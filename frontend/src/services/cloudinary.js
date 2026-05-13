// Cloudinary unsigned upload — gọi trực tiếp từ frontend, không cần backend.
//
// SETUP (1 lần):
// 1. Đăng ký https://cloudinary.com (free)
// 2. Settings → Upload → Add upload preset
//    - Signing Mode: **Unsigned**
//    - Tên preset, vd "lion_affiliate"
// 3. Trên Vercel → Environment Variables, thêm 2 vars:
//    - VITE_CLOUDINARY_CLOUD_NAME = cloud name của bạn
//    - VITE_CLOUDINARY_UPLOAD_PRESET = tên preset
// 4. Redeploy → nút "Upload từ máy" sẽ hiện
//
// Nếu không config → user vẫn paste URL được như cũ.

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

export const CLOUDINARY_ENABLED = Boolean(CLOUD_NAME && UPLOAD_PRESET);

/**
 * Compress + resize image trước khi upload.
 * - Resize: max 1920px cạnh dài (giữ tỉ lệ)
 * - Output: JPEG 85% quality
 * - Giảm 60-80% dung lượng → upload nhanh + tiết kiệm bandwidth Cloudinary.
 * Skip nếu file không phải image hoặc đã <500KB.
 */
async function compressImage(file, maxSize = 1920, quality = 0.85) {
  if (!file.type.startsWith('image/')) return file;
  if (file.size < 500 * 1024) return file; // <500KB skip
  if (file.type === 'image/gif') return file; // giữ GIF nguyên

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) {
            h = Math.round(h * (maxSize / w));
            w = maxSize;
          } else {
            w = Math.round(w * (maxSize / h));
            h = maxSize;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressed = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
              type: 'image/jpeg',
            });
            // Nếu compressed nặng hơn original (hiếm) thì dùng original
            resolve(compressed.size < file.size ? compressed : file);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload file → trả về URL ảnh.
 * - Tự compress trước nếu file > 500KB
 * - onProgress(percent): callback hiển thị progress bar.
 */
export async function uploadToCloudinary(file, { onProgress } = {}) {
  if (!CLOUDINARY_ENABLED) {
    throw new Error('Cloudinary chưa được cấu hình.');
  }

  // Compress trước khi upload
  const optimized = await compressImage(file).catch(() => file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
    const formData = new FormData();
    formData.append('file', optimized);
    formData.append('upload_preset', UPLOAD_PRESET);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({
            url: data.secure_url,
            publicId: data.public_id,
            width: data.width,
            height: data.height,
            bytes: data.bytes,
            format: data.format,
          });
        } catch (err) {
          reject(err);
        }
      } else {
        reject(new Error(`Upload fail (${xhr.status}): ${xhr.responseText}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error khi upload'));
    xhr.open('POST', url);
    xhr.send(formData);
  });
}

/** Upload nhiều file song song. */
export async function uploadMultiple(files, { onProgress } = {}) {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const fileResult = await uploadToCloudinary(files[i], {
      onProgress: (pct) => onProgress?.(i, pct),
    });
    results.push(fileResult);
  }
  return results;
}
