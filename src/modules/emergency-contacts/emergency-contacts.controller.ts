import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { EmergencyContactsService } from './emergency-contacts.service';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../types/auth.types';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentRoles } from '../../../generated/prisma/enums';
import { PaginationQueryFilter } from '../../common/filters/pagination-query.filter';
import { EmergencyContactFindOptionsQueryFilter } from './filter/emergency-contacts-find-options-query-filter';

@Controller('emergency-contacts')
export class EmergencyContactsController {
  constructor(
    private readonly emergencyContactsService: EmergencyContactsService,
  ) {}

  @Roles(CurrentRoles.DRIVER)
  @Post()
  create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateEmergencyContactDto,
  ) {
    return this.emergencyContactsService.create(userId, dto);
  }

  @Roles(CurrentRoles.DRIVER, CurrentRoles.ADMIN)
  @Get()
  findAll(
    @CurrentUser() userPayload: JwtPayload,
    @Query() pagination: PaginationQueryFilter,
    @Query() findOptions: EmergencyContactFindOptionsQueryFilter,
  ) {
    return this.emergencyContactsService.findAll(
      userPayload,
      pagination,
      findOptions,
    );
  }

  @Roles(CurrentRoles.DRIVER, CurrentRoles.ADMIN)
  @Get(':id')
  findOne(
    @CurrentUser() userPayload: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.emergencyContactsService.findOne(userPayload, id);
  }

  @Roles(CurrentRoles.DRIVER)
  @Patch(':id')
  update(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmergencyContactDto,
  ) {
    return this.emergencyContactsService.update(userId, id, dto);
  }

  @Roles(CurrentRoles.DRIVER)
  @Delete(':id')
  remove(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.emergencyContactsService.remove(userId, id);
  }
}
