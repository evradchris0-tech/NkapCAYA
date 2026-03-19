class ApiConstants {
  ApiConstants._();

  static const String baseUrl = 'https://api.caya.cm/api/v1';
  static const String wsUrl = 'wss://api.caya.cm/ws';

  // Timeouts
  static const int connectTimeoutMs = 10000;
  static const int receiveTimeoutMs = 30000;
  static const int sendTimeoutMs = 15000;

  // Auth endpoints
  static const String login = '/auth/login/';
  static const String logout = '/auth/logout/';
  static const String tokenRefresh = '/auth/token/refresh/';
  static const String tokenVerify = '/auth/token/verify/';

  // Member endpoints
  static const String myProfile = '/members/me/';
  static const String membersList = '/members/';

  // Savings endpoints
  static const String savingsBalance = '/savings/balance/';
  static const String savingsTransactions = '/savings/transactions/';
  static const String savingsDeposit = '/savings/deposit/';
  static const String savingsWithdrawal = '/savings/withdrawal/';

  // Loans endpoints
  static const String myLoans = '/loans/my-loans/';
  static const String loanRequest = '/loans/request/';
  static const String loanRepayment = '/loans/repayment/';

  // Rescue fund endpoints
  static const String rescueFundBalance = '/rescue-fund/balance/';
  static const String rescueFundContributions = '/rescue-fund/contributions/';

  // Storage keys
  static const String accessTokenKey = 'caya_access_token';
  static const String refreshTokenKey = 'caya_refresh_token';
}
