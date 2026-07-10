// Nén ảnh ở client trước khi gửi lên server:
// thu nhỏ về <= maxSize px -> xuất JPEG data URL (~15-40KB).
// Dùng createImageBitmap với imageOrientation:'from-image' để TÔN TRỌNG EXIF
// (ảnh dọc chụp từ điện thoại không bị xoay/méo).
export async function resizeImageFile(file: File, maxSize = 256, quality = 0.82): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Vui lòng chọn tệp ảnh')

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return resizeViaImage(file, maxSize, quality) // fallback trình duyệt cũ
  }

  try {
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Trình duyệt không hỗ trợ canvas')
    ctx.drawImage(bitmap, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    bitmap.close()
  }
}

// Fallback dùng <img> + FileReader (không đảm bảo EXIF nhưng vẫn chạy được).
function resizeViaImage(file: File, maxSize: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Không đọc được tệp'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Ảnh không hợp lệ'))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Trình duyệt không hỗ trợ canvas')); return }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
