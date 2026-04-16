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
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../types/auth.types';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentRoles } from '../../../generated/prisma/enums';
import { PaginationQueryFilter } from '../../common/filters/pagination-query.filter';
import { VehiclesFindOptionsQueryFilter } from './filter/vehicles-find-options-query-filter';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Roles(CurrentRoles.DRIVER)
  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(userId, dto);
  }

  @Roles(CurrentRoles.DRIVER, CurrentRoles.ADMIN)
  @Get()
  findAll(
    @CurrentUser() userPayload: JwtPayload,
    @Query() pagination: PaginationQueryFilter,
    @Query() findOptions: VehiclesFindOptionsQueryFilter,
  ) {
    return this.vehiclesService.findAll(userPayload, pagination, findOptions);
  }

  @Roles(CurrentRoles.DRIVER, CurrentRoles.ADMIN)
  @Get(':id')
  findOne(
    @CurrentUser() userPayload: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vehiclesService.findOne(userPayload, id);
  }

  @Roles(CurrentRoles.DRIVER)
  @Patch(':id')
  update(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(userId, id, dto);
  }

  @Roles(CurrentRoles.DRIVER)
  @Delete(':id')
  remove(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vehiclesService.remove(userId, id);
  }
}
