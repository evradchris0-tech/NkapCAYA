import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublicRepository } from '../repositories/public.repository';

export interface TontineInfoResponse {
  id: string;
  name: string;
  code: string;
  city: string;
  foundedYear: number;
  motto: string | null;
  activeMembersCount: number;
  baseUrl: string;
}

@Injectable()
export class PublicService {
  constructor(
    private readonly publicRepository: PublicRepository,
    private readonly configService: ConfigService,
  ) {}

  async getTontineInfo(): Promise<TontineInfoResponse> {
    const [config, activeMembersCount] = await Promise.all([
      this.publicRepository.findTontineConfig(),
      this.publicRepository.countActiveMembers(),
    ]);

    if (!config) {
      throw new NotFoundException('Configuration tontine introuvable');
    }

    const appUrl =
      this.configService.get<string>('APP_URL') ?? 'http://localhost:3000';
    const baseUrl = `${appUrl}/api/v1`;

    return {
      id: config.id,
      name: config.name,
      code: config.acronym,
      city: config.headquartersCity ?? '',
      foundedYear: config.foundedYear,
      motto: config.motto ?? null,
      activeMembersCount,
      baseUrl,
    };
  }
}
