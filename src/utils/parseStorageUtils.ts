import Parse from '../parseConfig';
import { NutritionLog, MeasurementUnit, AppState } from '../types';
import { getCurrentUser } from './authUtils';
import { createDailyLogs, getBaseConfig, updateBaseConfig } from '../services/configService';
import { defaultLogs } from '../data/defaultLogs';

// Unités de mesure par défaut
const defaultMeasurementUnits: MeasurementUnit[] = [
  { id: 'water', name: 'l' },
  { id: 'calories', name: 'kcal' },
  { id: 'protein', name: 'g' },
  { id: 'carbs', name: 'g' },
  { id: 'fat', name: 'g' }
];

// Logs nutritionnels par défaut
const defaultNutritionLogs = [
  {
    name: 'Eau',
    date: new Date(),
    currentValue: 0,
    targetValue: 2.5,
    mode: 'health' as 'health' | 'diet',
    unitName: 'l'
  },
  {
    name: 'Calories',
    date: new Date(),
    currentValue: 0,
    targetValue: 2000,
    mode: 'health' as 'health' | 'diet',
    unitName: 'kcal'
  },
  {
    name: 'Protéines',
    date: new Date(),
    currentValue: 0,
    targetValue: 60,
    mode: 'health' as 'health' | 'diet',
    unitName: 'g'
  },
  {
    name: 'Glucides',
    date: new Date(),
    currentValue: 0,
    targetValue: 250,
    mode: 'health' as 'health' | 'diet',
    unitName: 'g'
  },
  {
    name: 'Lipides',
    date: new Date(),
    currentValue: 0,
    targetValue: 70,
    mode: 'health' as 'health' | 'diet',
    unitName: 'g'
  }
];

export const getInitialState = async (): Promise<{ logs: NutritionLog[] }> => {
  const today = new Date().toISOString().split('T')[0];
  let currentUser;
  
  try {
    currentUser = await getCurrentUser();
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error('Please log in to access your data');
  }

  try {
    // Récupérer toutes les unités de mesure
    const unitsQuery = new Parse.Query('MeasurementUnit');
    let units = await unitsQuery.find();

    // Si aucune unité n'existe, créer les unités par défaut
    if (units.length === 0) {
      units = await Promise.all(
        defaultMeasurementUnits.map(async (unit) => {
          const measurementUnit = new Parse.Object('MeasurementUnit');
          measurementUnit.set('name', unit.name);
          await measurementUnit.save();
          return measurementUnit;
        })
      );
    }

    // Récupérer tous les logs nutritionnels de l'utilisateur pour aujourd'hui
    const logsQuery = new Parse.Query('NutritionLog');
    logsQuery.equalTo('user', currentUser);
    logsQuery.equalTo('date', new Date(today));
    let logs = await logsQuery.find();

    // Si aucun log n'existe pour aujourd'hui, en créer
    if (logs.length === 0) {
      logs = await createNutritionLogs(today, currentUser, units);
    }

    return {
      logs: logs.map(log => ({
        id: log.id || '',
        name: log.get('name'),
        date: log.get('date'),
        currentValue: log.get('currentValue'),
        targetValue: log.get('targetValue'),
        mode: log.get('mode') as 'health' | 'diet',
        unit: {
          id: log.get('unit').id || '',
          name: log.get('unit').get('name')
        },
        user: log.get('user').id || ''
      }))
    };
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
};

const createNutritionLogs = async (
  date: string,
  user: Parse.User,
  units: Parse.Object[]
): Promise<Parse.Object[]> => {
  const logs: Parse.Object[] = [];

  for (const defaultLog of defaultNutritionLogs) {
    const unit = units.find(u => u.get('name') === defaultLog.name);
    if (!unit) continue;

    const nutritionLog = new Parse.Object('NutritionLog');
    nutritionLog.set('name', defaultLog.name);
    nutritionLog.set('date', new Date(date));
    nutritionLog.set('currentValue', defaultLog.currentValue);
    nutritionLog.set('targetValue', defaultLog.targetValue);
    nutritionLog.set('mode', defaultLog.mode);
    nutritionLog.set('unit', unit);
    nutritionLog.set('user', user);
    await nutritionLog.save();
    logs.push(nutritionLog);
  }

  return logs;
};

const createNutritionLog = async (
  logId: string,
  user: Parse.User,
  date: Date
): Promise<Parse.Object> => {
  const defaultLog = defaultNutritionLogs.find(log => log.name.toLowerCase() === logId);
  if (!defaultLog) {
    throw new Error('Invalid log type');
  }

  // Récupérer l'unité de mesure correspondante
  const unitsQuery = new Parse.Query('MeasurementUnit');
  const unit = await unitsQuery.equalTo('name', defaultLog.unitName).first();

  if (!unit) {
    throw new Error('Unit not found');
  }

  const nutritionLog = new Parse.Object('NutritionLog');
  nutritionLog.set('name', defaultLog.name);
  nutritionLog.set('date', date);
  nutritionLog.set('currentValue', defaultLog.currentValue);
  nutritionLog.set('targetValue', defaultLog.targetValue);
  nutritionLog.set('mode', defaultLog.mode);
  nutritionLog.set('unit', unit);
  nutritionLog.set('user', user);
  await nutritionLog.save();
  return nutritionLog;
};

export const getNutritionLogs = async (): Promise<NutritionLog[]> => {
  const currentUser = await getCurrentUser();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const logsQuery = new Parse.Query('NutritionLog');
    logsQuery.equalTo('user', currentUser);
    logsQuery.greaterThanOrEqualTo('date', today);
    logsQuery.lessThan('date', new Date(today.getTime() + 24 * 60 * 60 * 1000));
    const logs = await logsQuery.find();

    if (logs.length === 0) {
      // Si pas de logs pour aujourd'hui, on en crée de nouveaux basés sur la configuration
      if (!currentUser.id) throw new Error('User ID is required');
      const dailyLogs = createDailyLogs(currentUser.id);
      const savedLogs = await Promise.all(
        dailyLogs.map(async (log) => {
          const newLog = new Parse.Object('NutritionLog');
          newLog.set('name', log.name);
          newLog.set('currentValue', log.currentValue);
          newLog.set('targetValue', log.targetValue);
          newLog.set('date', log.date);
          newLog.set('mode', log.mode);
          newLog.set('user', currentUser);
          
          const unit = new Parse.Object('MeasurementUnit');
          unit.set('name', log.unit.name);
          await unit.save();
          newLog.set('unit', unit);
          
          await newLog.save();
          return {
            id: newLog.id || '',
            name: newLog.get('name'),
            date: newLog.get('date'),
            currentValue: newLog.get('currentValue'),
            targetValue: newLog.get('targetValue'),
            mode: newLog.get('mode') as 'health' | 'diet',
            unit: {
              id: newLog.get('unit').id || '',
              name: newLog.get('unit').get('name')
            },
            user: newLog.get('user').id || ''
          };
        })
      );
      return savedLogs;
    }

    return logs.map(log => ({
      id: log.id || '',
      name: log.get('name'),
      date: log.get('date'),
      currentValue: log.get('currentValue'),
      targetValue: log.get('targetValue'),
      mode: log.get('mode') as 'health' | 'diet',
      unit: {
        id: log.get('unit').id || '',
        name: log.get('unit').get('name')
      },
      user: log.get('user').id || ''
    }));
  } catch (error) {
    console.error('Error fetching nutrition logs:', error);
    throw error;
  }
};

export const updateNutritionLog = async (
  logId: string,
  amount: number,
  isTarget: boolean = false,
  date: string
): Promise<NutritionLog[]> => {
  const currentUser = await getCurrentUser();
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  try {
    // Récupérer tous les logs du jour
    const logsQuery = new Parse.Query('NutritionLog');
    logsQuery.equalTo('user', currentUser);
    logsQuery.greaterThanOrEqualTo('date', targetDate);
    logsQuery.lessThan('date', new Date(targetDate.getTime() + 24 * 60 * 60 * 1000));
    const existingLogs = await logsQuery.find();

    // Chercher le log spécifique par son ID
    let log = existingLogs.find(l => l.id === logId);

    // Si le log n'existe pas, le créer
    if (!log) {
      if (!currentUser.id) throw new Error('User ID is required');
      
      const dailyLogs = createDailyLogs(currentUser.id);
      
      // Extraire le nom du log à partir de l'ID pour la création
      const logName = logId.startsWith('default_') 
        ? logId.replace('default_', '').replace(/_/g, ' ')
        : logId;
      
      const matchingLog = dailyLogs.find(l => l.name.toLowerCase() === logName.toLowerCase());
      
      if (matchingLog) {
        const newLog = new Parse.Object('NutritionLog');
        newLog.set('name', matchingLog.name);
        newLog.set('currentValue', matchingLog.currentValue);
        newLog.set('targetValue', matchingLog.targetValue);
        newLog.set('date', targetDate);
        newLog.set('mode', matchingLog.mode);
        newLog.set('user', currentUser);
        
        const unit = new Parse.Object('MeasurementUnit');
        unit.set('name', matchingLog.unit.name);
        await unit.save();
        newLog.set('unit', unit);
        
        log = await newLog.save();
      }
    }

    if (log) {
      if (isTarget) {
        log.set('targetValue', Math.round(amount * 10) / 10);
      } else {
        const currentValue = log.get('currentValue') || 0;
        const newValue = currentValue + amount;
        log.set('currentValue', newValue);
      }
      
      await log.save();
    }

    // Récupérer tous les logs mis à jour
    const updatedLogs = await logsQuery.find();
    const updatedLogsFormatted = updatedLogs.map(log => ({
      id: log.id || '',
      name: log.get('name'),
      date: log.get('date'),
      currentValue: Math.round(log.get('currentValue') * 10) / 10,
      targetValue: Math.round(log.get('targetValue') * 10) / 10,
      mode: log.get('mode') as 'health' | 'diet',
      unit: {
        id: log.get('unit').id || '',
        name: log.get('unit').get('name')
      },
      user: log.get('user').id || ''
    }));

    // Combiner avec les logs par défaut
    const allLogs = defaultLogs.map(defaultLog => {
      const existingLog = updatedLogsFormatted.find(log => 
        log.name.toLowerCase() === defaultLog.name.toLowerCase()
      );

      return existingLog || {
        id: `default_${defaultLog.name.toLowerCase().replace(/\s+/g, '_')}`,
        name: defaultLog.name,
        date: targetDate,
        currentValue: defaultLog.currentValue,
        targetValue: defaultLog.targetValue,
        mode: defaultLog.mode,
        unit: defaultLog.unit,
        user: currentUser.id || ''
      };
    });

    return allLogs;
  } catch (error) {
    console.error('Error in updateNutritionLog:', error);
    throw error;
  }
};

export const updateLogToDefault = async (logId: string, date: string): Promise<NutritionLog[]> => {
  const currentUser = await getCurrentUser();
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  try {
    // 1. Récupérer la valeur par défaut de defaultLogs
    const defaultLog = defaultLogs.find(log => log.id.toLowerCase() === logId.toLowerCase());
    
    if (!defaultLog) {
      throw new Error('Default log configuration not found');
    }

    // 2. Mettre à jour le localStorage avec la valeur par défaut
    const baseConfig = getBaseConfig();
    
    const updatedConfig = baseConfig.map(log => 
      log.id === defaultLog.id ? { ...log, targetValue: defaultLog.targetValue } : log
    );
    updateBaseConfig(updatedConfig);

    // 3. Vérifier et mettre à jour le log du jour si il existe
    const logsQuery = new Parse.Query('NutritionLog');
    logsQuery.equalTo('user', currentUser);
    logsQuery.equalTo('name', defaultLog.name);
    logsQuery.greaterThanOrEqualTo('date', targetDate);
    logsQuery.lessThan('date', new Date(targetDate.getTime() + 24 * 60 * 60 * 1000));
        
    const existingLog = await logsQuery.first();

    if (existingLog) {
      existingLog.set('targetValue', defaultLog.targetValue);
      await existingLog.save();
    }

    // Retourner le log mis à jour
    const result = [{
      id: existingLog?.id || '',
      name: defaultLog.name,
      date: targetDate,
      currentValue: existingLog?.get('currentValue') || 0,
      targetValue: defaultLog.targetValue,
      mode: defaultLog.mode as 'health' | 'diet',
      unit: defaultLog.unit,
      user: currentUser.id || ''
    }];
    
    return result;
  } catch (error) {
    console.error('Error updating log to default:', error);
    throw error;
  }
};

export const toggleNutritionMode = async (
  state: AppState,
  date: string
): Promise<AppState> => {
  const currentUser = await getCurrentUser();

  try {
    const logs = await new Parse.Query('NutritionLog')
      .equalTo('user', currentUser)
      .equalTo('date', new Date(date))
      .find();

    const newMode = state.nutritionLogs[date][0]?.mode === 'health' ? 'diet' : 'health';

    // Mettre à jour tous les logs du jour
    await Promise.all(logs.map(log => {
      log.set('mode', newMode);
      return log.save();
    }));

    // Mettre à jour l'état local
    const updatedLogs = state.nutritionLogs[date].map(l => ({
      ...l,
      mode: newMode as 'health' | 'diet'
    }));

    return {
      ...state,
      nutritionLogs: {
        ...state.nutritionLogs,
        [date]: updatedLogs
      }
    };
  } catch (error) {
    console.error('Error toggling nutrition mode:', error);
    throw error;
  }
};

export const updateNutritionTarget = async (
  state: AppState,
  date: string,
  logId: string,
  amount: number
): Promise<AppState> => {
  const currentUser = await getCurrentUser();

  try {
    const log = await new Parse.Query('NutritionLog')
      .equalTo('user', currentUser)
      .equalTo('objectId', logId)
      .first();

    if (!log) {
      throw new Error('Log not found');
    }

    log.set('targetValue', amount);
    await log.save();

    // Mettre à jour l'état local
    const updatedLogs = state.nutritionLogs[date].map(l => {
      if (l.id === logId) {
        return { ...l, targetValue: amount };
      }
      return l;
    });

    return {
      ...state,
      nutritionLogs: {
        ...state.nutritionLogs,
        [date]: updatedLogs
      }
    };
  } catch (error) {
    console.error('Error updating nutrition target:', error);
    throw error;
  }
};

export const getLogsForDate = async (date: string): Promise<NutritionLog[]> => {
  const currentUser = await getCurrentUser();
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  try {
    // Récupérer les logs existants en BDD
    const logsQuery = new Parse.Query('NutritionLog');
    logsQuery.equalTo('user', currentUser);
    logsQuery.greaterThanOrEqualTo('date', targetDate);
    logsQuery.lessThan('date', new Date(targetDate.getTime() + 24 * 60 * 60 * 1000));
    const existingLogs = await logsQuery.find();

    // Convertir les logs existants en format NutritionLog
    const existingLogsFormatted = existingLogs.map(log => ({
      id: log.id || '',
      name: log.get('name'),
      date: log.get('date'),
      currentValue: log.get('currentValue'),
      targetValue: log.get('targetValue'),
      mode: log.get('mode') as 'health' | 'diet',
      unit: {
        id: log.get('unit').id || '',
        name: log.get('unit').get('name')
      },
      user: log.get('user').id || ''
    }));

    // Créer un tableau avec tous les logs par défaut
    const allLogs = defaultLogs.map(defaultLog => {
      // Chercher si un log existe déjà pour ce type
      const existingLog = existingLogsFormatted.find(log => 
        log.name.toLowerCase() === defaultLog.name.toLowerCase()
      );

      // Si un log existe, utiliser ses valeurs, sinon utiliser les valeurs par défaut
      return existingLog || {
        id: `default_${defaultLog.name.toLowerCase().replace(/\s+/g, '_')}`, // ID unique basé sur le nom
        name: defaultLog.name,
        date: targetDate,
        currentValue: defaultLog.currentValue,
        targetValue: defaultLog.targetValue,
        mode: defaultLog.mode,
        unit: defaultLog.unit,
        user: currentUser.id || ''
      };
    });

    return allLogs;
  } catch (error) {
    console.error('Error fetching nutrition logs:', error);
    throw error;
  }
}; 