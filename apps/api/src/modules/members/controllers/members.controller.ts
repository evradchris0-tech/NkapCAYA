import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { MembersService } from '../services/members.service';
import { CreateMemberDto } from '../dto/create-member.dto';
import { UpdateMemberDto } from '../dto/update-member.dto';
import { EmergencyContactDto } from '../dto/emergency-contact.dto';
import { ChangeRoleDto } from '../dto/change-role.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { FilterMembersDto } from '../dto/filter-members.dto';
import { BureauRole } from '@prisma/client';

@ApiTags('Membres')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  // ── Création ──────────────────────────────────────────────────────────────

  @Post()
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT, BureauRole.VICE_PRESIDENT, BureauRole.SECRETAIRE_GENERAL, BureauRole.SECRETAIRE_ADJOINT)
  @ApiOperation({ summary: 'Inscrire un nouveau membre (crée User + MemberProfile)' })
  @ApiCreatedResponse({ description: 'Membre créé avec mot de passe temporaire' })
  createMember(@Body() dto: CreateMemberDto) {
    return this.membersService.createMember(dto);
  }

  // ── Consultation ──────────────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Mon profil membre — résolu depuis le JWT' })
  getMyProfile(@CurrentUser() user: { id: string }) {
    return this.membersService.findByUserId(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les membres avec filtres (paginé, recherche, rôle)' })
  findAll(@Query() filters: FilterMembersDto) {
    return this.membersService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: "Voir le profil complet d'un membre" })
  findById(@Param('id') id: string) {
    return this.membersService.findById(id);
  }

  @Get(':id/memberships')
  @ApiOperation({ summary: "Historique des adhésions d'un membre" })
  getMemberships(@Param('id') id: string) {
    return this.membersService.getMemberships(id);
  }

  @Get(':id/emergency-contacts')
  @ApiOperation({ summary: "Contacts d'urgence d'un membre" })
  getEmergencyContacts(@Param('id') id: string) {
    return this.membersService.getEmergencyContacts(id);
  }

  // ── Modification ──────────────────────────────────────────────────────────

  @Patch('me')
  @ApiOperation({ summary: "Mettre à jour mon propre profil (Self-service)" })
  async updateMyProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateMemberDto) {
    const profile = await this.membersService.findByUserId(userId);
    return this.membersService.updateProfile(profile.id, dto);
  }

  @Post('me/emergency-contacts')
  @ApiOperation({ summary: "Ajouter un contact d'urgence à mon profil (Self-service)" })
  async addMyEmergencyContact(@CurrentUser('id') userId: string, @Body() dto: EmergencyContactDto) {
    const profile = await this.membersService.findByUserId(userId);
    return this.membersService.addEmergencyContact(profile.id, dto);
  }

  @Patch(':id')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT, BureauRole.VICE_PRESIDENT, BureauRole.SECRETAIRE_GENERAL, BureauRole.SECRETAIRE_ADJOINT)
  @ApiOperation({ summary: "Mettre à jour le profil d'un membre (Admin)" })
  updateProfile(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.membersService.updateProfile(id, dto);
  }

  @Post(':id/emergency-contacts')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT, BureauRole.VICE_PRESIDENT, BureauRole.SECRETAIRE_GENERAL, BureauRole.SECRETAIRE_ADJOINT)
  @ApiOperation({ summary: "Ajouter un contact d'urgence (Admin)" })
  addEmergencyContact(@Param('id') id: string, @Body() dto: EmergencyContactDto) {
    return this.membersService.addEmergencyContact(id, dto);
  }

  // ── Activation / Désactivation ────────────────────────────────────────────

  @Patch(':id/role')
  @Roles(BureauRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Changer le rôle bureau d'un membre — SUPER_ADMIN seulement" })
  @ApiNoContentResponse()
  changeRole(@Param('id') id: string, @Body() dto: ChangeRoleDto) {
    return this.membersService.changeRole(id, dto.role);
  }

  @Patch(':id/reactivate')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Réactiver un compte membre — PRESIDENT ou SUPER_ADMIN' })
  @ApiNoContentResponse()
  reactivate(@Param('id') id: string) {
    return this.membersService.reactivate(id);
  }

  @Delete(':id')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désactiver un compte membre (soft — PRESIDENT ou SUPER_ADMIN)' })
  @ApiNoContentResponse()
  deactivate(@Param('id') id: string) {
    return this.membersService.deactivate(id);
  }

  @Delete(':id/emergency-contacts/:contactId')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT, BureauRole.VICE_PRESIDENT, BureauRole.SECRETAIRE_GENERAL, BureauRole.SECRETAIRE_ADJOINT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer un contact d'urgence" })
  @ApiNoContentResponse()
  removeEmergencyContact(@Param('contactId') contactId: string) {
    return this.membersService.removeEmergencyContact(contactId);
  }

  @Post(':id/reset-password')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT, BureauRole.VICE_PRESIDENT, BureauRole.SECRETAIRE_GENERAL)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Générer et envoyer un nouveau mot de passe temporaire (Forgot Password)" })
  @ApiNoContentResponse()
  resetPassword(@Param('id') id: string) {
    return this.membersService.resetPassword(id);
  }
}
