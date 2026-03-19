import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MembersService } from '../services/members.service';
import { CreateMemberDto } from '../dto/create-member.dto';
import { UpdateMemberDto } from '../dto/update-member.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new member' })
  createMember(@Body() dto: CreateMemberDto) {
    return this.membersService.createMember(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all members' })
  findAll() {
    return this.membersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a member by ID' })
  findById(@Param('id') id: string) {
    return this.membersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a member profile' })
  updateProfile(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.membersService.updateProfile(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a member' })
  remove(@Param('id') id: string) {
    return this.membersService.remove(id);
  }

  @Get(':id/memberships')
  @ApiOperation({ summary: 'Get all memberships for a member' })
  getMemberships(@Param('id') id: string) {
    return this.membersService.getMemberships(id);
  }
}
