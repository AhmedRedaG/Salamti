import { Injectable } from '@nestjs/common';
import { ConfigAndUrlOptions, UploadApiResponse } from 'cloudinary';
import { cloudinaryImageUploadOptions } from '../../config/cloudinary.config';
import * as streamifier from 'streamifier';
import { ImageCategory } from '../../types/upload.types';
import { ConfigService } from '@nestjs/config';
import { CloudinaryConfig } from '../../types/config.types';
import { v2 as cloudinaryApi } from 'cloudinary';

@Injectable()
export class CloudinaryUploadService {
  private cloudinary = cloudinaryApi;

  constructor(private configService: ConfigService) {
    const { cloudName, apiKey, apiSecret } =
      this.configService.get<CloudinaryConfig>('cloudinary')!;

    this.cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  uploadImage(
    file: Express.Multer.File,
    folder: ImageCategory,
  ): Promise<UploadApiResponse> {
    const imageUploadOptions = cloudinaryImageUploadOptions(folder);
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        imageUploadOptions,
        (error, result) => {
          if (error) return reject(error);
          resolve(result!);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  uploadMultipleImages(files: Express.Multer.File[], folder: ImageCategory) {
    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  deleteImage(publicId: string) {
    return this.cloudinary.uploader.destroy(publicId);
  }

  deleteMultipleImages(publicIds: string[]) {
    return this.cloudinary.api.delete_resources(publicIds);
  }

  getImageUrl(publicId: string, options?: ConfigAndUrlOptions) {
    return this.cloudinary.url(publicId, options);
  }

  getThumbnail(
    publicId: string,
    width: number = 200,
    height: number = 200,
  ): string {
    return this.cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto',
    });
  }
}
