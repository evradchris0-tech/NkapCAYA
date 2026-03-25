class AppConstants {
  AppConstants._();

  // App info
  static const String appName = 'CAYA';
  static const String appFullName = 'Club des Amis de Yaoundé';
  static const String currency = 'XAF';
  static const String currencyLocale = 'fr_CM';

  // Tontine rules
  static const int minContributionAmount = 10000;
  static const int maxLoanMultiplier = 3;
  static const double annualInterestRate = 0.10;
  static const double rescueFundRate = 0.02;

  // Pagination
  static const int defaultPageSize = 20;

  // Date formats
  static const String displayDateFormat = 'dd MMMM yyyy';
  static const String shortDateFormat = 'dd/MM/yyyy';
  static const String apiDateFormat = 'yyyy-MM-dd';
  static const String displayDateTimeFormat = 'dd/MM/yyyy HH:mm';

  // Versioning
  static const String appVersion = '1.0.0';
  static const int buildNumber = 1;

  // Navigation route names
  static const String routeSplash = '/';
  static const String routeTontineSearch = '/tontine-search';
  static const String routeLogin = '/login';
  static const String routeDashboard = '/dashboard';
  static const String routeSavings = '/savings';
  static const String routeLoans = '/loans';
  static const String routePayments = '/payments';
  static const String routeRescueFund = '/rescue-fund';
  static const String routeProfile = '/profile';
}
