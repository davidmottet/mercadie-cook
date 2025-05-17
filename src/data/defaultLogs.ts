import { NutritionLog } from '../types';

export const defaultLogs: NutritionLog[] = [
  {
    id: 'eau',
    name: 'Eau',
    currentValue: 0,
    targetValue: 2.5,
    unit: { id: 'water', name: 'l' },
    mode: 'health',
    date: new Date(),
    user: ''
  },
  {
    id: 'calories',
    name: 'Calories',
    currentValue: 0,
    targetValue: 2000,
    unit: { id: 'calories', name: 'kcal' },
    mode: 'health',
    date: new Date(),
    user: ''
  },
  {
    id: 'proteines',
    name: 'Protéines',
    currentValue: 0,
    targetValue: 60,
    unit: { id: 'protein', name: 'g' },
    mode: 'health',
    date: new Date(),
    user: ''
  },
  {
    id: 'glucides',
    name: 'Glucides',
    currentValue: 0,
    targetValue: 250,
    unit: { id: 'carbs', name: 'g' },
    mode: 'health',
    date: new Date(),
    user: ''
  },
  {
    id: 'lipides',
    name: 'Lipides',
    currentValue: 0,
    targetValue: 70,
    unit: { id: 'fat', name: 'g' },
    mode: 'health',
    date: new Date(),
    user: ''
  }
]; 