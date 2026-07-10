// Nén ảnh ở client trước khi gửi lên server:
// đọc file -> vẽ vào canvas thu nhỏ về <= maxSize px -> xuất JPEG data URL (~15-40KB).
export function resizeImageFile(file: File, maxSize = 256, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Vui lòng chọn tệp ảnh'))
      return
    }
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
