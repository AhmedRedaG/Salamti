import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CurrentRoles } from '../../../generated/prisma/enums';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Roles(CurrentRoles.ADMIN)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id);
  }
}
