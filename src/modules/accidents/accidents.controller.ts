import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { AccidentsService } from './accidents.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentRoles } from '../../../generated/prisma/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../types/auth.types';
import { PaginationQueryFilter } from '../../common/filters/pagination-query.filter';
import { AccidentsFindOptionsQueryFilter } from './filter/accidents-find-options-query-filter';
import { Public } from '../../common/decorators/public.decorator';
import { CreateAppSosAccidentDto } from './dto/create-app-sos-accident.dto';

@Controller('accidents')
export class AccidentsController {
  constructor(private readonly accidentsService: AccidentsService) {}

  // create accident from app sos button
  @Roles(CurrentRoles.DRIVER)
  @Post('app-sos')
  createAppSosAccident(
    @CurrentUser('sub') id: string,
    @Body() dto: CreateAppSosAccidentDto,
  ) {
    return this.accidentsService.createAppSosAccident(id, dto);
  }

  @Roles(CurrentRoles.ADMIN, CurrentRoles.DRIVER)
  @Get()
  findAll(
    @CurrentUser() userPayload: JwtPayload,
    @Query() pagination: PaginationQueryFilter,
    @Query() findOptions: AccidentsFindOptionsQueryFilter,
  ) {
    return this.accidentsService.findAll(userPayload, pagination, findOptions);
  }

  @Roles(CurrentRoles.ADMIN, CurrentRoles.DRIVER)
  @Get(':id')
  findOne(
    @CurrentUser() userPayload: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.accidentsService.findOne(userPayload, id);
  }

  @Roles(CurrentRoles.ADMIN)
  @Patch(':id/cancel')
  cancelAccidentManual(@Param('id', ParseUUIDPipe) id: string) {
    return this.accidentsService.cancelAccidentManual(id);
  }

  // TODO: remove this endpoint before production
  @Public()
  @Post('fake-create')
  fakeAccidentCreation(@Body() dto: CreateAccidentDto) {
    return this.accidentsService.createAccident(dto);
  }

  // TODO: remove this endpoint before production
  @Public()
  @Post('fake-cancel')
  fakeAccidentsCancelling(@Body('instNumber') obuInst: string) {
    return this.accidentsService.cancelAccident(obuInst);
  }
}
