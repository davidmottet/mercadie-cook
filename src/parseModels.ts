import Parse from 'parse';

// Classe pour stocker les unités de mesure
Parse.Object.registerSubclass('MeasurementUnit', class extends Parse.Object {
  constructor() {
    super('MeasurementUnit');
  }

  get name(): string {
    return this.get('name');
  }

  set name(value: string) {
    this.set('name', value);
  }
});

// Classe pour stocker les logs nutritionnels
Parse.Object.registerSubclass('NutritionLog', class extends Parse.Object {
  constructor() {
    super('NutritionLog');
  }

  get name(): string {
    return this.get('name');
  }

  set name(value: string) {
    this.set('name', value);
  }

  get date(): Date {
    return this.get('date');
  }

  set date(value: Date) {
    this.set('date', value);
  }

  get currentValue(): number {
    return this.get('currentValue');
  }

  set currentValue(value: number) {
    this.set('currentValue', value);
  }

  get targetValue(): number {
    return this.get('targetValue');
  }

  set targetValue(value: number) {
    this.set('targetValue', value);
  }

  get mode(): string {
    return this.get('mode');
  }

  set mode(value: string) {
    this.set('mode', value);
  }

  get unit(): Parse.Pointer {
    return this.get('unit');
  }

  set unit(value: Parse.Pointer) {
    this.set('unit', value);
  }

  get user(): Parse.Pointer {
    return this.get('user');
  }

  set user(value: Parse.Pointer) {
    this.set('user', value);
  }
});

export { Parse }; 