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
 * Upload file → trả về URL ảnh.
 * onProgress(percent): callback hiển thị progress bar.
 */
export function uploadToCloudinary(file, { onProgress } = {}) {
  if (!CLOUDINARY_ENABLED) {
    return Promise.reject(new Error('Cloudinary chưa được cấu hình.'));
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
    const formData = new FormData();
    formData.append('file', file);
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
