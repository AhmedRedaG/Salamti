import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  Delete,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';

import {
  multerUploadImageOptions,
  validateUploadImagePipList,
} from '../../config/multer.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('profile-image')
  @UseInterceptors(FileInterceptor('image', multerUploadImageOptions))
  uploadProfileImage(
    @UploadedFile(new ParseFilePipe({ validators: validateUploadImagePipList }))
    image: Express.Multer.File,
    @CurrentUser('sub') userId: string,
  ) {
    return this.uploadService.uploadProfileImage(userId, image);
  }

  @Delete('profile-image')
  deleteProfileImage(@CurrentUser('sub') userId: string) {
    return this.uploadService.deleteProfileImage(userId);
  }
}
