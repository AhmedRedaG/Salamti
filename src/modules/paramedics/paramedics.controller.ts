import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ParamedicsService } from './paramedics.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentRoles } from '../../../generated/prisma/enums';
import { PaginationQueryFilter } from '../../common/filters/pagination-query.filter';
import { ParamedicsLocationFindOptionsQueryFilter } from './filter/users-find-options-query-filter';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('paramedics')
export class ParamedicsController {
  constructor(private readonly paramedicsService: ParamedicsService) {}

  @Roles(CurrentRoles.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Post(':id/authorize')
  authorizeParamedic(@Param('id', ParseUUIDPipe) id: string) {
    return this.paramedicsService.paramedicAuthorization(id, true);
  }

  @Roles(CurrentRoles.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Post(':id/unauthorize')
  unauthorizeParamedic(@Param('id', ParseUUIDPipe) id: string) {
    return this.paramedicsService.paramedicAuthorization(id, false);
  }

  @Roles(CurrentRoles.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Get('locations')
  findAllParamedicsLocations(
    @Query() findOptions: ParamedicsLocationFindOptionsQueryFilter,
    @Query() pagination: PaginationQueryFilter,
  ) {
    return this.paramedicsService.findAllParamedicsLocations(
      pagination,
      findOptions,
    );
  }

  @Roles(CurrentRoles.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Get(':id/location')
  findParamedicLocation(@Param('id', ParseUUIDPipe) id: string) {
    return this.paramedicsService.findParamedicLocation(id);
  }

  // TODO: remove this endpoint before production
  @HttpCode(HttpStatus.OK)
  @Post('force-availability')
  forceAvailability(@CurrentUser('sub') userId: string) {
    return this.paramedicsService.forceAvailability(userId);
  }
}
