/**
 * Convierte una imagen a Base64 para guardar en Firestore
 * @param file - Archivo de imagen a convertir
 * @returns String en formato Base64 (data:image/jpeg;base64,...)
 */
export async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer la imagen'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Valida que el archivo sea una imagen válida con límite de peso
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 500 * 1024; // 500KB para evitar consultas lentas en Firestore

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'El archivo debe ser una imagen (JPG, PNG o WebP)',
    };
  }

  if (file.size > maxSize) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    return {
      valid: false,
      error: `La imagen es muy pesada (${sizeMB}MB). Máximo permitido: 500KB para mantener consultas rápidas.`,
    };
  }

  return { valid: true };
}

/**
 * Comprime una imagen si es necesario antes de convertir a Base64
 * @param file - Archivo original
 * @param maxSizeKB - Tamaño máximo en KB (default 500KB)
 * @returns File comprimido o el original si ya es pequeño
 */
export async function compressImageIfNeeded(file: File, maxSizeKB: number = 500): Promise<File> {
  if (file.size <= maxSizeKB * 1024) {
    return file; // Ya está dentro del límite
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Reducir dimensiones proporcionalmente
        const maxDimension = 1200;
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convertir a Blob con calidad ajustada
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Error al comprimir la imagen'));
            }
          },
          'image/jpeg',
          0.8 // Calidad 80%
        );
      };
      
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}
