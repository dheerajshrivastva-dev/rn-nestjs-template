import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

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
}
