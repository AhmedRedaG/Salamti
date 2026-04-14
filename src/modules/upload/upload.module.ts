import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { UsersModule } from '../users/users.module';
import { CloudinaryUploadModule } from '../../integrations/cloudinary-upload/cloudinary-upload.module';

@Module({
  imports: [UsersModule, CloudinaryUploadModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
