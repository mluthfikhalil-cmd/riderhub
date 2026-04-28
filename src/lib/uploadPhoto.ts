import { supabase } from './supabase';
import { Platform } from 'react-native';

/**
 * Upload photo to Supabase Storage
 * Works on web via file input, on native via expo-image-picker
 */
export const uploadPhoto = async (
  file: File | { uri: string; type: string; name: string },
  folder: 'posts' | 'profiles' | 'garage' = 'posts'
): Promise<{ url: string | null; error: string | null }> => {
  try {
    const timestamp = Date.now();
    let arrayBuffer: ArrayBuffer;
    let contentType: string;
    let fileName: string;

    if (Platform.OS === 'web' && file instanceof File) {
      arrayBuffer = await file.arrayBuffer();
      contentType = file.type;
      fileName = `${folder}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    } else {
      const nativeFile = file as { uri: string; type: string; name: string };
      const response = await fetch(nativeFile.uri);
      arrayBuffer = await response.arrayBuffer();
      contentType = nativeFile.type || 'image/jpeg';
      fileName = `${folder}/${timestamp}_${nativeFile.name || 'photo.jpg'}`;
    }

    const { data, error } = await supabase.storage
      .from('riderhub-uploads')
      .upload(fileName, arrayBuffer, {
        contentType,
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('riderhub-uploads')
      .getPublicUrl(data.path);

    return { url: urlData.publicUrl, error: null };
  } catch (e: any) {
    return { url: null, error: e?.message || 'Upload gagal.' };
  }
};

/**
 * Web-only: open file picker and return File
 */
export const pickImageWeb = (): Promise<File | null> => {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') { resolve(null); return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0] || null;
      resolve(file);
    };
    input.click();
  });
};

/**
 * Compress image on web before uploading (resize to max 1024px)
 */
export const compressImageWeb = (file: File, maxSize = 1024): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) { resolve(file); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = (height / width) * maxSize; width = maxSize; }
          else { width = (width / height) * maxSize; height = maxSize; }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          else resolve(file);
        }, 'image/jpeg', 0.85);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};
