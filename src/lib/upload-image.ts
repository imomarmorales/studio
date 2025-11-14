import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Sube una imagen a Firebase Storage y retorna la URL pública
 * @param file - Archivo de imagen a subir
 * @param path - Ruta en Storage (ej: 'events/imagen.jpg')
 * @returns URL pública de la imagen subida
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  const storage = getStorage();
  const storageRef = ref(storage, path);
  
  // Subir archivo
  await uploadBytes(storageRef, file);
  
  // Obtener URL pública
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * Genera un nombre único para un archivo
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Valida que el archivo sea una imagen válida
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'El archivo debe ser una imagen (JPG, PNG o WebP)',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'La imagen no debe superar los 5MB',
    };
  }

  return { valid: true };
}
