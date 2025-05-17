export interface MeasurementUnit {
  id: string;
  name: string;
}

export interface NutritionLog {
  id: string;
  name: string;
  date: Date;
  currentValue: number;
  targetValue: number;
  mode: 'health' | 'diet';
  unit: MeasurementUnit;
  user: string;
}

export interface AppState {
  currentDate: string;
  nutritionLogs: Record<string, NutritionLog[]>;
}