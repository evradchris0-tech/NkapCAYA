class ApiConstants {
  ApiConstants._();

  // baseUrl est géré dynamiquement par tontineProvider → apiClientProvider
  // (fallback : variable d'environnement API_BASE_URL dans .env)

  // Timeouts
  static const int connectTimeoutMs = 10000;
  static const int receiveTimeoutMs = 30000;
  static const int sendTimeoutMs = 15000;

  // Auth endpoints
  static const String login = '/auth/login';
  static const String logout = '/auth/logout';
  static const String tokenRefresh = '/auth/refresh';
  static const String authMe = '/auth/me';

  // Member endpoints
  static const String membersList = '/members';
  static const String memberProfile = '/members/me'; // résolu depuis JWT
  static String memberMemberships(String profileId) =>
      '/members/$profileId/memberships';

  // Savings endpoints
  static String savings(String membershipId) => '/savings/$membershipId';

  // Loans endpoints
  static const String loans = '/loans'; // GET ?membershipId=X
  static const String loanRequest = '/loans/request';
  static String loanRepay(String loanId) => '/loans/$loanId/repay';
  static String loanDisburse(String loanId) => '/loans/$loanId/disburse';

  // Rescue fund endpoints — préfixés par fiscalYearId (obligatoire côté backend)
  static String rescueFundLedger(String fyId) =>
      '/fiscal-years/$fyId/rescue-fund';
  static String rescueFundEvents(String fyId) =>
      '/fiscal-years/$fyId/rescue-fund/events';
  // rescueFundPosition : endpoint inexistant côté backend — position retournée null

  // Storage keys
  static const String accessTokenKey = 'caya_access_token';
  static const String refreshTokenKey = 'caya_refresh_token';
}
