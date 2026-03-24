class ApiConstants {
  ApiConstants._();

  // DEV local — remplacer par https://api.caya.cm/api/v1 en production
  static const String baseUrl = 'http://192.168.1.33:3000/api/v1';
  static const String wsUrl = 'ws://192.168.1.33:3000/ws';

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

  // Rescue fund endpoints
  static const String rescueFund = '/rescue-fund';
  static const String rescueFundEvents = '/rescue-fund/events';
  static String rescueFundPosition(String membershipId) =>
      '/rescue-fund/positions/$membershipId';

  // Storage keys
  static const String accessTokenKey = 'caya_access_token';
  static const String refreshTokenKey = 'caya_refresh_token';
}
