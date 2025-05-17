import { NutritionLog } from '../types';
import { defaultLogs } from '../data/defaultLogs';

const CONFIG_KEY = 'nutrition_config';

export const getBaseConfig = (): NutritionLog[] => {
  const savedConfig = localStorage.getItem(CONFIG_KEY);
  if (savedConfig) {
    return JSON.parse(savedConfig);
  }
  // Si pas de config sauvegardée, on sauvegarde la config par défaut
  localStorage.setItem(CONFIG_KEY, JSON.stringify(defaultLogs));
  return defaultLogs;
};

export const updateBaseConfig = (logs: NutritionLog[]): void => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(logs));
};

export const resetBaseConfig = (): void => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(defaultLogs));
};

export const createDailyLogs = (userId: string): NutritionLog[] => {
  const baseConfig = getBaseConfig();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return baseConfig.map(log => ({
    ...log,
    currentValue: 0,
    date: today,
    user: userId
  }));
}; 