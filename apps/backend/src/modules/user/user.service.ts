import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole, UserStatus, ROLE_AUTHORITY } from '../../common/enums';

export interface ListUsersQuery {
  role?: UserRole;
  status?: UserStatus;
  search?: string;    // matches firstName, lastName, email
  page?: number;
  limit?: number;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.userRepo.update(id, dto);
    return this.findById(id);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.userRepo.update(id, { password: hashedPassword });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepo.update(id, { lastLoginAt: new Date() });
  }

  async findAll(query: ListUsersQuery = {}): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const { role, status, search, page = 1, limit = 20 } = query;
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    const qb = this.userRepo
      .createQueryBuilder('u')
      .select([
        'u.id', 'u.firstName', 'u.lastName', 'u.email', 'u.phone',
        'u.role', 'u.status', 'u.emailVerified', 'u.lastLoginAt', 'u.createdAt',
      ])
      .orderBy('u.createdAt', 'DESC')
      .take(take)
      .skip(skip);

    if (role) qb.andWhere('u.role = :role', { role });
    if (status) qb.andWhere('u.status = :status', { status });
    if (search) {
      qb.andWhere(
        '(u.firstName ILIKE :s OR u.lastName ILIKE :s OR u.email ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit: take };
  }

  async assignRole(actorId: string, targetId: string, newRole: UserRole): Promise<User> {
    if (actorId === targetId) {
      throw new BadRequestException('Cannot change your own role');
    }

    const [actor, target] = await Promise.all([
      this.userRepo.findOne({ where: { id: actorId } }),
      this.userRepo.findOne({ where: { id: targetId } }),
    ]);

    if (!actor) throw new NotFoundException('Actor not found');
    if (!target) throw new NotFoundException('User not found');

    const actorAuthority = ROLE_AUTHORITY[actor.role];
    const targetCurrentAuthority = ROLE_AUTHORITY[target.role];
    const targetNewAuthority = ROLE_AUTHORITY[newRole];

    // Actor must have authority >= the new role being assigned
    if (actorAuthority < targetNewAuthority) {
      throw new ForbiddenException(
        `Cannot assign role "${newRole}" — your authority (${actorAuthority}) is lower than the role's authority (${targetNewAuthority})`,
      );
    }

    // Actor must have authority > the target's current role (can't touch peers or superiors)
    if (actorAuthority <= targetCurrentAuthority) {
      throw new ForbiddenException(
        `Cannot change role of a user with equal or higher authority`,
      );
    }

    await this.userRepo.update(target.id, { role: newRole });
    return this.findById(target.id);
  }
}
