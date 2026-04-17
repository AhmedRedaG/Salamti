import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { PaginationQueryFilter } from '../../common/filters/pagination-query.filter';
import { UserFindOptionsQueryFilter } from './filter/users-find-options-query-filter';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentRoles } from '../../../generated/prisma/enums';
import type { JwtPayload } from '../../types/auth.types';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(CurrentRoles.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Post(':id/activate')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.activate(id);
  }

  @Roles(CurrentRoles.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Post(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.deactivate(id);
  }

  @Roles(CurrentRoles.ADMIN)
  @Get()
  findAll(
    @Query() pagination: PaginationQueryFilter,
    @Query() findOptions: UserFindOptionsQueryFilter,
  ) {
    return this.usersService.findAll(pagination, findOptions);
  }

  @Get('my-profile')
  findMyProfile(@CurrentUser('sub') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Roles(CurrentRoles.ADMIN)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) userId: string) {
    return this.usersService.findOne(userId);
  }

  @Patch('change-password')
  changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.usersService.changePassword(userId, dto);
  }

  @Roles(CurrentRoles.ADMIN)
  @Patch(':id/reset-password')
  resetPasswordByAdmin(@Param('id', ParseUUIDPipe) userId: string) {
    return this.usersService.resetPasswordByAdmin(userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() userPayload: JwtPayload,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(userPayload, id, dto);
  }
}
