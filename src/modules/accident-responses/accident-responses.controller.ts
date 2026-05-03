import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { AccidentResponsesService } from './accident-responses.service';
import { CompleteAccidentResponseDto } from './dto/complete-accident-response.dto';
import { AccidentResponsesFindOptionsQueryFilter } from './filter/accident-responses-find-options-query-filter';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentRoles } from '../../../generated/prisma/enums';
import type { JwtPayload } from '../../types/auth.types';
import { PaginationQueryFilter } from '../../common/filters/pagination-query.filter';

@Controller('accident-responses')
export class AccidentResponsesController {
  constructor(
    private readonly accidentResponsesService: AccidentResponsesService,
  ) {}

  @Roles(CurrentRoles.PARAMEDIC, CurrentRoles.ADMIN)
  @Get()
  findAll(
    @CurrentUser() userPayload: JwtPayload,
    @Query() pagination: PaginationQueryFilter,
    @Query() findOptions: AccidentResponsesFindOptionsQueryFilter,
  ) {
    return this.accidentResponsesService.findAll(
      userPayload,
      pagination,
      findOptions,
    );
  }

  @Roles(CurrentRoles.PARAMEDIC, CurrentRoles.ADMIN)
  @Get(':id')
  findOne(
    @CurrentUser() userPayload: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.accidentResponsesService.findOne(userPayload, id);
  }

  @Roles(CurrentRoles.PARAMEDIC)
  @Patch(':id/arrive')
  markArrived(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.accidentResponsesService.markArrived(userId, id);
  }

  @Roles(CurrentRoles.PARAMEDIC)
  @Patch(':id/complete')
  markCompleted(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteAccidentResponseDto,
  ) {
    return this.accidentResponsesService.markCompleted(userId, id, dto);
  }
}
