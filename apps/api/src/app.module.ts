import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
})
export class AppModule {}
