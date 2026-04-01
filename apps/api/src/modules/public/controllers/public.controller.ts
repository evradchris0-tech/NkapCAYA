import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PublicService } from '../services/public.service';

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('tontine-info')
  @ApiOperation({
    summary: 'Informations publiques de la tontine (sans authentification)',
    description:
      'Retourne le nom, code, ville, année de fondation et nombre de membres actifs. ' +
      'Utilisé par l\'app mobile sur l\'écran de sélection de tontine (avant login).',
  })
  getTontineInfo() {
    return this.publicService.getTontineInfo();
  }
}
