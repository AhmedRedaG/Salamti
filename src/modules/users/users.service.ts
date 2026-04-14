import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { AuthUtilsService } from '../auth/auth-utils.service';
import {
  UserSelect,
  UserUncheckedCreateInput,
  UserWhereInput,
} from '../../../generated/prisma/models';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { getPaginationParams } from '../../common/utils/pagination.utils';
import { PaginationQueryFilter } from '../../common/filters/pagination-query.filter';
import {
  UserGetPayload,
  UserInclude,
  UserScalarFieldEnum,
} from '../../../generated/prisma/internal/prismaNamespace';
import { UserFindOptionsQueryFilter } from './filter/users-find-options-query-filter';
import {
  CurrentRoles,
  NotificationSlug,
} from '../../../generated/prisma/enums';
import { RolesService } from '../roles/roles.service';
import { NotificationService } from '../notification/notification.service';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../../../generated/prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtPayload } from '../../types/auth.types';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly authUtilsService: AuthUtilsService,
    private readonly rolesService: RolesService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateUserDto) {
    // check if user already exists by email
    const existedUser = await this.findOneByEmail(dto.email, { id: true });
    if (existedUser) {
      throw new ConflictException('users.USER_ALREADY_EXISTS');
    }

    // extract role name and other data
    const { role: roleName, age, bloodType, employeeId, ...initData } = dto;

    // validate role activity
    const role = await this.rolesService.findOrThrow(
      { name: roleName },
      { id: true, isActive: true },
    );
    if (!role.isActive) {
      throw new BadRequestException('roles.ROLE_IS_NOT_ACTIVE');
    }

    // set new user initial data
    const data: UserUncheckedCreateInput = {
      roleId: role.id,
      ...initData,

      // initialize auth attempts record
      authAttempts: {
        create: {},
      },
    };

    // automatically create related data based on role
    if (dto.role === CurrentRoles.PARAMEDIC) {
      data.paramedic = {
        create: { employeeId: employeeId! },
      };
    }
    if (dto.role === CurrentRoles.DRIVER) {
      data.driver = {
        create: { age: age!, bloodType: bloodType! },
      };
    }

    // create user
    const user = await this.prismaService.user.create({
      data,
      include: { role: true },
    });

    this.logger.log(`create user id: ${user.id} data: ${JSON.stringify(dto)}`);

    return {
      success: true,
      data: {
        user,
      },
    };
  }

  async activate(id: string) {
    const user = await this.findOrThrow({ id }, { isActive: true });
    if (user.isActive) {
      throw new ConflictException('users.USER_ALREADY_ACTIVATED');
    }
    await this.prismaService.user.update({
      where: { id },
      data: {
        isActive: true,
        // reset auth attempts
        authAttempts: {
          update: {
            where: { userId: id },
            data: { login: 0, reset: 0, sendOtp: 0 },
          },
        },
      },
    });
    return { success: true };
  }

  async deactivate(id: string) {
    const user = await this.findOrThrow({ id }, { isActive: true });
    if (!user.isActive) {
      throw new ConflictException('users.USER_ALREADY_DEACTIVATED');
    }
    await this.prismaService.user.update({
      where: { id },
      data: {
        isActive: false,
        // revoke all user sessions
        userSessions: {
          updateMany: {
            where: { userId: id },
            data: { isRevoked: true },
          },
        },
      },
    });
    return { success: true };
  }

  async findAll(
    pagination: PaginationQueryFilter,
    findOptions: UserFindOptionsQueryFilter,
  ) {
    const { page, limit, offset } = getPaginationParams(
      pagination.page,
      pagination.limit,
    );

    const { isActive, isVerified, roleId, search, orderBy, orderDirection } =
      findOptions;

    // create where condition
    const where: UserWhereInput = {
      isActive,
      isVerified,
      roleId,
    };

    // add search logic
    if (search) {
      where.OR = [
        { phone: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // validate orderedBy
    if (!UserScalarFieldEnum[orderBy]) {
      throw new BadRequestException('users.INVALID_ORDERBY_FIELD');
    }

    // fetch users with pagination and total count
    const [users, total] = await this.prismaService.$transaction([
      this.prismaService.user.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: {
          [orderBy]: orderDirection,
        },
        select: {
          id: true,
          fullName: true,
          image: true,
          isActive: true,
          isVerified: true,
          phone: true,
          email: true,
          createdAt: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prismaService.user.count({ where }),
    ]);

    return {
      success: true,
      data: {
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        users,
      },
    };
  }

  async findOne(userId: string) {
    // fetch user with role or fail fast
    const targetUser = await this.findOrThrow(
      { id: userId },
      {
        role: {
          select: {
            name: true,
          },
        },
      },
    );

    // main include
    const include: UserInclude = {
      role: {
        select: {
          id: true,
          name: true,
        },
      },
    };

    // for drivers
    if (targetUser.role.name === CurrentRoles.DRIVER) {
      include.driver = {
        include: {
          emergencyContacts: true,
          vehicles: { include: { obus: true } },
          incidents: { take: 10, orderBy: { createdAt: 'desc' } },
        },
      };
    }

    // for paramedics
    if (targetUser.role.name === CurrentRoles.PARAMEDIC) {
      include.paramedic = {
        include: {
          incidentResponses: {
            take: 10,
            orderBy: { dispatchedAt: 'desc' },
            include: { incident: true },
          },
        },
      };
    }

    // for admins
    if (targetUser.role.name === CurrentRoles.ADMIN) {
      include.admin = true;
    }

    const user = await this.findIncludeOrThrow({ id: userId }, include);
    return { success: true, data: { user } };
  }

  async update(
    userPayload: JwtPayload,
    targetUserId: string,
    dto: UpdateUserDto,
  ) {
    const user = await this.findOrThrow(
      { id: targetUserId },
      { id: true, email: true },
    );

    // check if user is authorized to update
    if (userPayload.sub !== targetUserId) {
      // only admin can update other users
      if (userPayload.ur !== CurrentRoles.ADMIN) {
        throw new UnauthorizedException('users.UNAUTHORIZED_TO_UPDATE_USER');
      }
    }

    // check if email already exists
    if (dto.email && dto.email !== user.email) {
      const existedUser = await this.findOneByEmail(dto.email);
      if (existedUser) {
        throw new ConflictException('users.USER_ALREADY_EXISTS_WITH_EMAIL');
      }
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: targetUserId },
      data: dto,
    });

    this.logger.log(
      `update user id: ${targetUserId} data: ${JSON.stringify(dto)}`,
    );

    return { success: true, data: { user: updatedUser } };
  }

  async changePassword(id: string, dto: UpdatePasswordDto) {
    const user = await this.findOrThrow({ id }, { passwordHash: true });

    if (dto.oldPassword === dto.newPassword) {
      throw new ConflictException('users.NEW_PASSWORD_MUST_BE_DIFFERENT');
    }

    // in case of google
    if (!user.passwordHash) {
      throw new UnauthorizedException('users.GOOGLE_ACCOUNT');
    }

    const isValidPassword = await this.authUtilsService.validatePassword(
      dto.oldPassword,
      user.passwordHash,
    );
    if (!isValidPassword) {
      throw new UnauthorizedException('users.INVALID_OLD_PASSWORD');
    }

    // hash and set new password
    await this.setPassword(id, dto.newPassword);

    // trigger notification
    await this.notificationService.queueNotification({
      recipientId: id,
      typeSlug: NotificationSlug.PASSWORD_CHANGED,
      referenceId: id,
      referenceTable: 'user',
    });

    return { success: true };
  }

  async resetPasswordByAdmin(id: string) {
    const user = await this.findOrThrow({ id }, { phone: true });

    // set password to default
    const password = this.generateDefaultPassword(user.phone);
    await this.setPassword(id, password);

    return { success: true };
  }

  // ================== Helper Methods ==================

  async findOneByEmail<T extends UserSelect | undefined>(
    email: string,
    select?: T,
  ) {
    return (await this.prismaService.user.findUnique({
      where: { email },
      select,
    })) as UserGetPayload<{ select: T }>;
  }

  async findOrThrow<T extends UserSelect | undefined>(
    where: UserWhereInput,
    select?: T,
  ) {
    try {
      return (await this.prismaService.user.findFirstOrThrow({
        where,
        select,
      })) as UserGetPayload<{ select: T }>;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException('users.USER_NOT_FOUND');
      throw error;
    }
  }

  async findIncludeOrThrow<T extends UserInclude | undefined>(
    where: UserWhereInput,
    include?: T,
  ) {
    try {
      return (await this.prismaService.user.findFirstOrThrow({
        where,
        include,
      })) as UserGetPayload<{ include: T }>;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException('users.USER_NOT_FOUND');
      throw error;
    }
  }

  async setGoogleId(id: string, googleId: string) {
    await this.prismaService.user.update({
      where: { id },
      data: {
        googleId,
      },
    });
  }

  async setPassword(id: string, password: string) {
    const passwordHash = await this.authUtilsService.hashPassword(password);

    await this.prismaService.user.update({
      where: { id },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        // reset auth attempts
        authAttempts: {
          update: {
            where: {
              userId: id,
            },
            data: {
              login: 0,
              reset: 0,
              sendOtp: 0,
            },
          },
        },
      },
    });
  }

  async setResetToken(userId: string, resetToken: string) {
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        resetToken,
      },
    });
  }

  async clearResetToken(userId: string) {
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        resetToken: null,
      },
    });
  }

  async updateImage(userId: string, image: string | null) {
    const user = await this.findOrThrow({ id: userId }, { image: true });
    await this.prismaService.user.update({
      where: { id: userId },
      data: { image },
    });
    return {
      oldImage: user.image,
    };
  }

  async confirmVerification(userId: string) {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });
  }

  private generateDefaultPassword(phone: string): string {
    return (
      this.configService.get<string>('auth.defaultPasswordPrefix')! +
      phone.slice(2)
    );
  }
}
