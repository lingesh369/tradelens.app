
// Basic settings types without Gennie functionality
export interface UserSettings {
  base_currency: string;
  time_zone: string;
  subscription_status: string;
}

export interface AppSettings {
  darkMode: boolean;
  notifications: boolean;
  emailNotifications: boolean;
}
