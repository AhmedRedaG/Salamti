import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ImageCategory } from '../../types/upload.types';
import { UsersService } from '../users/users.service';
import { CloudinaryUploadService } from '../../integrations/cloudinary-upload/cloudinary-upload.service';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private readonly usersService: UsersService,
    private cloudinaryUploadService: CloudinaryUploadService,
  ) {}

  async uploadProfileImage(userId: string, image: Express.Multer.File) {
    try {
      const newImage = await this.cloudinaryUploadService.uploadImage(
        image,
        ImageCategory.PROFILE,
      );
      const newImageUrl = newImage.secure_url;

      const { oldImage } = await this.usersService.updateImage(
        userId,
        newImageUrl,
      );

      if (oldImage) {
        const oldImagePublicId = this.extractImagePublicId(oldImage);
        this.deleteImageInBackground(oldImagePublicId);
      }

      return {
        success: true,
        data: {
          image: newImageUrl,
        },
      };
    } catch (error: any) {
      if (error.http_code) {
        throw new BadRequestException('upload.FAILED_TO_UPLOAD_IMAGE');
      }
      throw error;
    }
  }

  async deleteProfileImage(userId: string) {
    const { oldImage } = await this.usersService.updateImage(userId, null);

    if (oldImage) {
      const oldImagePublicId = this.extractImagePublicId(oldImage);
      this.deleteImageInBackground(oldImagePublicId);
    }

    return {
      success: true,
    };
  }

  private extractImagePublicId(url: string) {
    return url.split('/').slice(-4).join('/').split('.')[0];
  }

  private deleteImageInBackground(publicId: string) {
    this.cloudinaryUploadService
      .deleteImage(publicId)
      .catch((err) =>
        this.logger.error(
          `failed to delete old image ${publicId} error: ${JSON.stringify(
            err,
          )}`,
        ),
      );
  }
}
