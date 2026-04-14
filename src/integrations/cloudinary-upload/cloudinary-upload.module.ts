import { Module } from '@nestjs/common';
import { CloudinaryUploadService } from './cloudinary-upload.service';

@Module({
  providers: [CloudinaryUploadService],
  exports: [CloudinaryUploadService],
})
export class CloudinaryUploadModule {}
