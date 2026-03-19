import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { BureauRole } from '@prisma/client';

@ApiTags('Membres')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  // ── Création ──────────────────────────────────────────────────────────────

  @Post()
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.SECRETAIRE_GENERAL, BureauRole.SECRETAIRE_ADJOINT)
  @ApiOperation({ summary: 'Inscrire un nouveau membre (crée User + MemberProfile)' })
  @ApiCreatedResponse({ description: 'Membre créé avec mot de passe temporaire' })
  createMember(@Body() dto: CreateMemberDto) {
    return this.membersService.createMember(dto);
  }

  // ── Consultation ──────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Lister tous les membres' })
  findAll() {
    return this.membersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Voir le profil complet d\'un membre' })
  findById(@Param('id') id: string) {
    return this.membersService.findById(id);
  }

  @Get(':id/memberships')
  @ApiOperation({ summary: 'Historique des adhésions d\'un membre' })
  getMemberships(@Param('id') id: string) {
    return this.membersService.getMemberships(id);
  }

  @Get(':id/emergency-contacts')
  @ApiOperation({ summary: 'Contacts d\'urgence d\'un membre' })
  getEmergencyContacts(@Param('id') id: string) {
    return this.membersService.getEmergencyContacts(id);
  }

  // ── Modification ──────────────────────────────────────────────────────────

  @Patch(':id')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.SECRETAIRE_GENERAL, BureauRole.SECRETAIRE_ADJOINT)
  @ApiOperation({ summary: 'Mettre à jour le profil d\'un membre' })
  updateProfile(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.membersService.updateProfile(id, dto);
  }

  @Post(':id/emergency-contacts')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.SECRETAIRE_GENERAL, BureauRole.SECRETAIRE_ADJOINT)
  @ApiOperation({ summary: 'Ajouter un contact d\'urgence' })
  addEmergencyContact(@Param('id') id: string, @Body() dto: EmergencyContactDto) {
    return this.membersService.addEmergencyContact(id, dto);
  }

  // ── Désactivation ─────────────────────────────────────────────────────────

  @Delete(':id')
  @Roles(BureauRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désactiver un compte membre (soft — SUPER_ADMIN seulement)' })
  @ApiNoContentResponse()
  deactivate(@Param('id') id: string) {
    return this.membersService.deactivate(id);
  }

  @Delete(':id/emergency-contacts/:contactId')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.SECRETAIRE_GENERAL, BureauRole.SECRETAIRE_ADJOINT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un contact d\'urgence' })
  @ApiNoContentResponse()
  removeEmergencyContact(@Param('contactId') contactId: string) {
    return this.membersService.removeEmergencyContact(contactId);
  }
}
