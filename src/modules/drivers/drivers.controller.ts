import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentRoles } from '../../../generated/prisma/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../types/auth.types';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Roles(CurrentRoles.DRIVER)
  @Get('medical-info')
  findMedicalInfo(@CurrentUser('sub') userId: string) {
    return this.driversService.findMedicalInfo(userId);
  }

  @Roles(CurrentRoles.DRIVER, CurrentRoles.ADMIN)
  @Patch(':id')
  update(
    @CurrentUser() userPayload: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDriverDto,
  ) {
    return this.driversService.update(userPayload, id, dto);
  }
}
