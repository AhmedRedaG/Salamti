import { UploadApiOptions } from 'cloudinary';
import { ImageCategory } from '../types/upload.types';
import appConfig from './app.config';

const { allowedImageTypes } = appConfig().upload;

export const cloudinaryImageUploadOptions = (
  imageCategory: ImageCategory,
): UploadApiOptions => {
  return {
    resource_type: 'image',
    folder: `salamti/images/${imageCategory}`,
    quality: 'auto',
    fetch_format: 'auto',
    unique_filename: false,
    public_id:
      Date.now() + '-' + Math.round(Math.random() * 1e9) + '-' + imageCategory,
    allowed_formats: allowedImageTypes,
    timeout: 1000 * 60 * 10, // 10 minutes
    overwrite: true,
    invalidate: true,
  };
};
