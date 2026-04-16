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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ObusService } from './obus.service';
import { CreateObuDto } from './dto/create-obu.dto';
import { UpdateObuDto } from './dto/update-obu.dto';
import { ClaimObuDto } from './dto/claim-obu.dto';
import { ConnectObuDto } from './dto/connect-obu.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../types/auth.types';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentRoles } from '../../../generated/prisma/enums';
import { PaginationQueryFilter } from '../../common/filters/pagination-query.filter';
import { ObusFindOptionsQueryFilter } from './filter/obus-find-options-query-filter';

@Controller('obus')
export class ObusController {
  constructor(private readonly obusService: ObusService) {}

  @Roles(CurrentRoles.ADMIN)
  @Post()
  create(@Body() dto: CreateObuDto) {
    return this.obusService.create(dto);
  }

  @Roles(CurrentRoles.DRIVER)
  @HttpCode(HttpStatus.OK)
  @Post('claim')
  claim(@CurrentUser('sub') userId: string, @Body() dto: ClaimObuDto) {
    return this.obusService.claim(userId, dto);
  }

  @Roles(CurrentRoles.DRIVER)
  @Patch(':id/connect')
  connectToVehicle(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConnectObuDto,
  ) {
    return this.obusService.connectToVehicle(userId, id, dto);
  }

  @Roles(CurrentRoles.DRIVER)
  @Patch(':id/disconnect')
  disconnectFromVehicle(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.obusService.disconnectFromVehicle(userId, id);
  }

  @Roles(CurrentRoles.DRIVER, CurrentRoles.ADMIN)
  @Get()
  findAll(
    @CurrentUser() userPayload: JwtPayload,
    @Query() pagination: PaginationQueryFilter,
    @Query() findOptions: ObusFindOptionsQueryFilter,
  ) {
    return this.obusService.findAll(userPayload, pagination, findOptions);
  }

  @Roles(CurrentRoles.DRIVER, CurrentRoles.ADMIN)
  @Get(':id')
  findOne(
    @CurrentUser() userPayload: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.obusService.findOne(userPayload, id);
  }

  @Roles(CurrentRoles.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateObuDto) {
    return this.obusService.update(id, dto);
  }

  @Roles(CurrentRoles.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.obusService.remove(id);
  }
}
