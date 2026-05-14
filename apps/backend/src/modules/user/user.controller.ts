import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMe(@CurrentUser() user: User) {
    return user;
  }

  @Patch('me')
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    return this.userService.update(user.id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }
}
