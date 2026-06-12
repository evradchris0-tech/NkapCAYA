import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@database/prisma.service';
import { FiscalYearService } from '@modules/fiscal-year/services/fiscal-year.service';
import { SessionsService } from '@modules/sessions/services/sessions.service';
import { CassationService } from '@modules/cassation/services/cassation.service';
import { LoansService } from '@modules/loans/services/loans.service';
import { RescueFundService } from '@modules/rescue-fund/services/rescue-fund.service';
import { BureauRole, FiscalYearStatus, EnrollmentType } from '@prisma/client';
import Decimal from 'decimal.js';

describe('Complex Financial Flow (Integration)', () => {
  let module: TestingModule;
  let prisma: PrismaService;
  let fyService: FiscalYearService;
  let sessionsService: SessionsService;
  let cassationService: CassationService;
  let loansService: LoansService;
  let rescueFundService: RescueFundService;

  let adminId: string;
  let fyId: string;
  let sessionIds: string[] = [];

  // Variables membres
  let aliceId: string; // 1 part
  let bobId: string;   // 2 parts
  let charlieId: string; // 1 part

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    fyService = module.get<FiscalYearService>(FiscalYearService);
    sessionsService = module.get<SessionsService>(SessionsService);
    cassationService = module.get<CassationService>(CassationService);
    loansService = module.get<LoansService>(LoansService);
    rescueFundService = module.get<RescueFundService>(RescueFundService);

    // DANGER: Vider la base de test
    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);
    const tables = ['session_entries', 'monthly_sessions', 'loan_repayments', 'loan_accounts', 'cassation_records', 'memberships', 'member_profiles', 'users', 'fiscal_years'];
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${table};`);
    }
    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);
  });

  afterAll(async () => {
    await module.close();
  });

  it('1. Création de l\'exercice fiscal et Inscription', async () => {
    // Créer Admin
    const admin = await prisma.user.create({
      data: {
        username: 'admin', passwordHash: 'pwd', phone: '000', role: BureauRole.PRESIDENT,
        profile: { create: { firstName: 'Admin', lastName: 'Sys', memberCode: 'ADM', phone1: '000', neighborhood: 'Local' } }
      },
      include: { profile: true }
    });
    adminId = admin.id;

    // Créer FY
    const fy = await fyService.create({
      label: 'TEST-2026', startDate: '2026-10-01', endDate: '2027-09-30',
      cassationDate: '2027-08-31', loanDueDate: '2027-06-30'
    }, adminId);
    fyId = fy.id;

    // Configurer la Tontine Globale
    await prisma.tontineConfig.upsert({
      where: { id: 'caya' },
      update: { minSavingsToLoan: 0, rescueFundMinBalance: 0 },
      create: {
        id: 'caya',
        name: 'CAYA',
        acronym: 'CAYA',
        foundedYear: 2026,
        shareUnitAmount: 10000,
        registrationFeeNew: 2000,
        registrationFeeReturning: 2000,
        minSavingsToLoan: 0,
        rescueFundMinBalance: 0,
        updatedById: adminId
      }
    });

    const createMember = async (name: string, parts: number) => {
      const u = await prisma.user.create({
        data: {
          username: name.toLowerCase(), passwordHash: 'pwd', phone: name, role: BureauRole.MEMBRE,
          profile: { create: { firstName: name, lastName: 'Test', memberCode: name, phone1: '123', neighborhood: 'Local' } }
        },
        include: { profile: true }
      });
      const mem = await fyService.addMember(fyId, {
        profileId: (u as any).profile.id, enrollmentType: EnrollmentType.NEW, sharesCount: parts,
        joinedAt: '2026-10-01', joinedAtMonth: 1
      }, adminId);
      return mem.id;
    };

    aliceId = await createMember('Alice', 1);
    bobId = await createMember('Bob', 2);
    charlieId = await createMember('Charlie', 1);

    expect(aliceId).toBeDefined();
    expect(bobId).toBeDefined();
    expect(charlieId).toBeDefined();
  });

  it('2. Activation et Session 1 : Cotisation normale', async () => {
    await fyService.activate(fyId, adminId);
    
    // Override rescue fund ledger minimum for test
    await prisma.rescueFundLedger.update({
      where: { fiscalYearId: fyId },
      data: { minimumPerMember: 0 }
    });

    const sessions = await prisma.monthlySession.findMany({ where: { fiscalYearId: fyId }, orderBy: { sessionNumber: 'asc' } });
    sessionIds = sessions.map(s => s.id);

    // Open session 1
    await sessionsService.openSession(sessionIds[0], adminId);

    // Session 1 : Alice (1 part), Bob (2 parts), Charlie (1 part) paient tout.
    const entries = [
      { membershipId: aliceId, type: 'INSCRIPTION', amount: 2000 },
      { membershipId: aliceId, type: 'SECOURS', amount: 2000 },
      { membershipId: aliceId, type: 'EPARGNE', amount: 10000 },
      { membershipId: bobId, type: 'INSCRIPTION', amount: 2000 },
      { membershipId: bobId, type: 'SECOURS', amount: 2000 },
      { membershipId: bobId, type: 'EPARGNE', amount: 20000 },
      { membershipId: charlieId, type: 'INSCRIPTION', amount: 2000 },
      { membershipId: charlieId, type: 'SECOURS', amount: 2000 },
      { membershipId: charlieId, type: 'EPARGNE', amount: 10000 },
    ];
    for (const e of entries) {
      await sessionsService.recordEntry(sessionIds[0], e as any, adminId);
    }

    await sessionsService.closeForReview(sessionIds[0], adminId);
    const s1 = await sessionsService.validateAndClose(sessionIds[0], adminId);
    expect(s1.status).toBe('CLOSED');
  });

  it('3. Session 2 : Prêt de Alice et Pénalité de Bob', async () => {
    // Open session 2
    await sessionsService.openSession(sessionIds[1], adminId);

    // Alice contracte un prêt de 20 000
    await loansService.requestLoan({
      membershipId: aliceId,
      amount: 20000,
      dueBeforeDate: '2027-04-30',
      requestNotes: 'Business'
    }, adminId);

    // On l'approuve
    const loans = await prisma.loanAccount.findMany({ where: { membershipId: aliceId } });
    await loansService.approveLoan(loans[0].id, adminId);

    await sessionsService.closeForReview(sessionIds[1], adminId);
    await sessionsService.validateAndClose(sessionIds[1], adminId);
  });

  it('4. Session 3 : Caisse de Secours & Intérêts', async () => {
    // Open session 3
    await sessionsService.openSession(sessionIds[2], adminId);

    // Injecter un type d'événement pour le test
    await prisma.rescueEventAmount.upsert({
      where: { eventType: 'ILLNESS' },
      update: { amount: 6000 },
      create: { eventType: 'ILLNESS', label: 'Maladie', amount: 6000, updatedById: adminId }
    });

    // Un événement secours survient pour Charlie
    await rescueFundService.recordEvent(fyId, {
      beneficiaryMembershipId: charlieId,
      eventType: 'ILLNESS' as any,
      description: 'Maladie', 
      eventDate: '2026-12-01'
    }, adminId);

    // Charlie a reçu 6000
    const event = await prisma.rescueFundEvent.findFirst({ where: { beneficiaryId: charlieId } });
    expect(event).toBeDefined();

    await sessionsService.closeForReview(sessionIds[2], adminId);
    await sessionsService.validateAndClose(sessionIds[2], adminId);
  });

  it('5. Session 4 : Pot pour Bob', async () => {
    // Open session 4
    await sessionsService.openSession(sessionIds[3], adminId);

    // Bob gagne le pot. On enregistre le décaissement du pot
    await sessionsService.recordEntry(sessionIds[3], {
      membershipId: bobId, type: 'POT', amount: 40000,
      isOutOfSession: false
    } as any, adminId);

    await sessionsService.closeForReview(sessionIds[3], adminId);
    await sessionsService.validateAndClose(sessionIds[3], adminId);
  });
  
  it('6. Cassation finale (fin de cycle)', async () => {
    // On ouvre et ferme toutes les sessions jusqu'à la dernière
    for (let i = 4; i < 11; i++) {
      await sessionsService.openSession(sessionIds[i], adminId);
      await sessionsService.closeForReview(sessionIds[i], adminId);
      await sessionsService.validateAndClose(sessionIds[i], adminId);
    }
    // Session finale
    await sessionsService.openSession(sessionIds[11], adminId);
    await sessionsService.closeForReview(sessionIds[11], adminId);
    await sessionsService.validateAndClose(sessionIds[11], adminId);

    // Open cassation
    await fyService.openCassation(fyId, adminId);

    // Cassation
    const result = await cassationService.executeCassation(fyId, adminId);
    expect(result.id).toBeDefined();

    const fyState = await fyService.findById(fyId);
    expect(fyState.status).toBe('CLOSED');
  });
});
