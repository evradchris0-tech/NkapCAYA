import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { TontineConfigModule } from './modules/config/config.module';
import { MembersModule } from './modules/members/members.module';
import { FiscalYearModule } from './modules/fiscal-year/fiscal-year.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { SavingsModule } from './modules/savings/savings.module';
import { LoansModule } from './modules/loans/loans.module';
import { RescueFundModule } from './modules/rescue-fund/rescue-fund.module';
import { BeneficiariesModule } from './modules/beneficiaries/beneficiaries.module';
import { CassationModule } from './modules/cassation/cassation.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PublicModule } from './modules/public/public.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard }, // Rate limiting global
  ],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'global', ttl: 60_000, limit: 120 }, // 120 req/min par défaut
    ]),
    DatabaseModule,
    // Modules métier — ordre respectant les dépendances
    PublicModule,
    AuthModule,
    TontineConfigModule,
    MembersModule,
    FiscalYearModule,
    SessionsModule,
    SavingsModule,
    LoansModule,
    RescueFundModule,
    BeneficiariesModule,
    CassationModule,
    ReportsModule,
    NotificationsModule,
    HealthModule,
  ],
})
export class AppModule {}
