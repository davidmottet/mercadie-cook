import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Parse from '../parseConfig';

interface MeasurementUnit {
  id: string;
  name: string;
}

interface Ingredient {
  id: string;
  name: string;
  displayName?: string;
  displayPlural?: string;
  plural?: string;
  type: string;
  frozenOrCanned: boolean;
  seasons: string[];
  withPork?: boolean;
  unbreakable?: boolean;
  ignoreShoppingList: boolean;
  storeShelf: number;
  quantity: number;
  measurementUnit: {
    id: string;
    name: string;
  };
  grossWeight: number;
}

interface RecipeStepIngredient {
  ingredient: {
    id: string;
    name: string;
    displayName?: string;
    displayPlural?: string;
    plural?: string;
    type: string;
    frozenOrCanned: boolean;
    seasons: string[];
    withPork?: boolean;
    unbreakable?: boolean;
    ignoreShoppingList: boolean;
    storeShelf: number;
    grossWeight: number;
  };
  quantity: number;
  unit: {
    id: string;
    name: string;
  };
  notes?: string;
}

interface RecipeStep {
  order: number;
  type: 'preparation' | 'cooking' | 'rest';
  text: string;
  temperature?: number;
  cookingTime?: number;
  notes?: string;
  subSteps?: string[];
  image?: string;
  imageAlt?: string;
  familyProfile?: string;
  video?: string;
  ingredients: RecipeStepIngredient[];
}

interface Recipe {
  id: string;
  name: string;
  slug: string;
  preparationTime: number;
  bakingTime: number;
  restTime: number;
  difficulty: string;
  cookingTemperature: number;
  generalTips: string;
  benefits: string;
  portions: number;
  minPortions?: number;
  maxPortions?: number;
  mainComponent: string;
  unbreakable?: boolean;
  image: string;
  imageAlt?: string;
  coverDesktop?: string;
  coverMobile?: string;
  coverAlt?: string;
  video?: string;
  publicationPlatforms?: string[];
  published: boolean;
  archived: boolean;
  recipeCategory: string;
  ranking: string;
  seasons?: string[];
  express: boolean;
  nutriscore: string;
  kcalPer100g: number;
  kjPer100g: number;
  lipidsPer100g: number;
  saturatedFattyAcidsPer100g: number;
  carbohydratesPer100g: number;
  simpleSugarsPer100g: number;
  fibresPer100g: number;
  saltPer100g: number;
  pnnsFruitPer100g: number;
  pnnsVegetablePer100g: number;
  oilsPer100g: number;
  pnnsNutsPer100g: number;
  pnnsDriedVegetablePer100g: number;
  proteinsPer100g: number;
  familyRecipe: boolean;
  parent: boolean;
  tags?: string[];
  steps: RecipeStep[];
}

const Recipe: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [measurementUnits, setMeasurementUnits] = useState<MeasurementUnit[]>([]);
  const [selectedPortions, setSelectedPortions] = useState<number>(0);
  const [showDetailedNutrition, setShowDetailedNutrition] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!slug) {
        setError('Slug de recette manquant');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching recipe with slug:', slug);
        const query = new Parse.Query('Recipe');
        query.equalTo('slug', slug);
        const recipe = await query.first();
        
        if (!recipe) {
          console.log('No recipe found for slug:', slug);
          setError('Recette non trouvée');
          setLoading(false);
          return;
        }

        console.log('Recipe found:', recipe.toJSON());

        // Récupérer les étapes de la recette
        const stepsQuery = new Parse.Query('RecipeStep');
        stepsQuery.equalTo('recipe', recipe);
        stepsQuery.ascending('order');
        const steps = await stepsQuery.find();
        console.log('Steps found:', steps.map(step => step.toJSON()));

        // Récupérer tous les ingrédients uniques des étapes
        const allIngredientIds = steps.flatMap(step => 
          (step.get('ingredients') || []).map((ing: any) => ing.ingredient.id)
        );
        console.log('All ingredient IDs:', allIngredientIds);

        // Récupérer toutes les unités de mesure uniques
        const allUnitIds = steps.flatMap(step => 
          (step.get('ingredients') || []).map((ing: any) => ing.unit.id)
        );
        console.log('All unit IDs:', allUnitIds);

        // Récupérer les ingrédients
        const ingredientsQuery = new Parse.Query('Ingredient');
        if (allIngredientIds.length > 0) {
          ingredientsQuery.containedIn('objectId', allIngredientIds);
          const ingredientsResults = await ingredientsQuery.find();
          console.log('Ingredients found:', ingredientsResults.map(i => i.toJSON()));
          
          // Créer un Map pour stocker les ingrédients uniques
          const uniqueIngredients = new Map();
          
          // Parcourir les étapes pour collecter les ingrédients
          steps.forEach(step => {
            const stepIngredients = step.get('ingredients') || [];
            stepIngredients.forEach((ingredientData: any) => {
              const ingredient = ingredientsResults.find(i => i.id === ingredientData.ingredient.id);
              if (ingredient && !uniqueIngredients.has(ingredientData.ingredient.id)) {
                uniqueIngredients.set(ingredientData.ingredient.id, {
                  id: ingredient.id,
                  name: ingredient.get('name'),
                  displayName: ingredient.get('displayName'),
                  displayPlural: ingredient.get('displayPlural'),
                  plural: ingredient.get('plural'),
                  type: ingredient.get('type'),
                  frozenOrCanned: ingredient.get('frozenOrCanned'),
                  seasons: ingredient.get('seasons'),
                  withPork: ingredient.get('withPork'),
                  unbreakable: ingredient.get('unbreakable'),
                  ignoreShoppingList: ingredient.get('ignoreShoppingList'),
                  storeShelf: ingredient.get('storeShelf'),
                  grossWeight: ingredient.get('grossWeight')
                });
              }
            });
          });

          setIngredients(Array.from(uniqueIngredients.values()));
        }

        // Récupérer les unités de mesure
        const unitsQuery = new Parse.Query('MeasurementUnit');
        if (allUnitIds.length > 0) {
          unitsQuery.containedIn('objectId', allUnitIds);
          const unitsResults = await unitsQuery.find();
          console.log('Units found:', unitsResults.map(u => u.toJSON()));
          
          setMeasurementUnits(unitsResults.map(unit => ({
            id: unit.id || '',
            name: unit.get('name') || ''
          })));
        }

        setRecipe({
          id: recipe.id || '',
          name: recipe.get('name'),
          slug: recipe.get('slug'),
          preparationTime: recipe.get('preparationTime'),
          bakingTime: recipe.get('bakingTime'),
          restTime: recipe.get('restTime'),
          difficulty: recipe.get('difficulty'),
          cookingTemperature: recipe.get('cookingTemperature'),
          generalTips: recipe.get('generalTips'),
          benefits: recipe.get('benefits'),
          portions: recipe.get('portions'),
          minPortions: recipe.get('minPortions'),
          maxPortions: recipe.get('maxPortions'),
          mainComponent: recipe.get('mainComponent'),
          unbreakable: recipe.get('unbreakable'),
          image: recipe.get('image'),
          imageAlt: recipe.get('imageAlt'),
          coverDesktop: recipe.get('coverDesktop'),
          coverMobile: recipe.get('coverMobile'),
          coverAlt: recipe.get('coverAlt'),
          video: recipe.get('video'),
          publicationPlatforms: recipe.get('publicationPlatforms'),
          published: recipe.get('published'),
          archived: recipe.get('archived'),
          recipeCategory: recipe.get('recipeCategory'),
          ranking: recipe.get('ranking'),
          seasons: recipe.get('seasons'),
          express: recipe.get('express'),
          nutriscore: recipe.get('nutriscore'),
          kcalPer100g: recipe.get('kcalPer100g'),
          kjPer100g: recipe.get('kjPer100g'),
          lipidsPer100g: recipe.get('lipidsPer100g'),
          saturatedFattyAcidsPer100g: recipe.get('saturatedFattyAcidsPer100g'),
          carbohydratesPer100g: recipe.get('carbohydratesPer100g'),
          simpleSugarsPer100g: recipe.get('simpleSugarsPer100g'),
          fibresPer100g: recipe.get('fibresPer100g'),
          saltPer100g: recipe.get('saltPer100g'),
          pnnsFruitPer100g: recipe.get('pnnsFruitPer100g'),
          pnnsVegetablePer100g: recipe.get('pnnsVegetablePer100g'),
          oilsPer100g: recipe.get('oilsPer100g'),
          pnnsNutsPer100g: recipe.get('pnnsNutsPer100g'),
          pnnsDriedVegetablePer100g: recipe.get('pnnsDriedVegetablePer100g'),
          proteinsPer100g: recipe.get('proteinsPer100g'),
          familyRecipe: recipe.get('familyRecipe'),
          parent: recipe.get('parent'),
          tags: recipe.get('tags'),
          steps: steps.map(step => ({
            order: step.get('order'),
            type: step.get('type'),
            text: step.get('text'),
            temperature: step.get('temperature'),
            cookingTime: step.get('cookingTime'),
            notes: step.get('notes'),
            subSteps: step.get('subSteps'),
            image: step.get('image'),
            imageAlt: step.get('imageAlt'),
            familyProfile: step.get('familyProfile'),
            video: step.get('video'),
            ingredients: step.get('ingredients') || []
          }))
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching recipe:', err);
        setError('Erreur lors du chargement de la recette');
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [slug]);

  // Fonction pour obtenir l'unité de mesure
  const getMeasurementUnit = (unitId: string) => {
    return measurementUnits.find(unit => unit.id === unitId)?.name || '';
  };

  // Fonction pour ajuster les quantités en fonction des portions
  const getAdjustedQuantity = (ingredient: Ingredient, stepIngredients: RecipeStepIngredient[]) => {
    if (!recipe || selectedPortions === 0) return null;
    
    const stepIngredient = stepIngredients.find(ing => ing.ingredient.id === ingredient.id);
    if (!stepIngredient) return null;

    const ratio = selectedPortions / recipe.portions;
    const adjustedQuantity = Math.round(stepIngredient.quantity * ratio * 100) / 100;
    
    return {
      quantity: adjustedQuantity,
      unit: stepIngredient.unit
    };
  };

  // Mettre à jour les portions sélectionnées quand la recette est chargée
  useEffect(() => {
    if (recipe) {
      setSelectedPortions(recipe.portions);
    }
  }, [recipe]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <div className="text-2xl text-gray-700">Chargement...</div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <div className="text-2xl text-red-600">{error || 'Recette non trouvée'}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* En-tête de la recette */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">{recipe.name}</h1>
        <div className="flex items-center space-x-4 text-gray-600">
          <span>⏱️ {recipe.preparationTime} min</span>
          {recipe.bakingTime > 0 && <span>🔥 {recipe.bakingTime} min</span>}
          {recipe.restTime > 0 && <span>⏳ {recipe.restTime} min</span>}
          <div className="flex items-center space-x-2">
            <span>👥</span>
            <select
              value={selectedPortions}
              onChange={(e) => setSelectedPortions(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: (recipe.maxPortions || recipe.portions * 2) - (recipe.minPortions || 1) + 1 }, (_, i) => {
                const portions = (recipe.minPortions || 1) + i;
                return (
                  <option key={portions} value={portions}>
                    {portions} {portions > 1 ? 'portions' : 'portion'}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Colonne principale */}
        <div className="flex-grow">
          {/* Image principale */}
          <div className="mb-8">
            <img 
              src={recipe.image} 
              alt={recipe.imageAlt || recipe.name}
              className="w-full h-96 object-cover rounded-lg shadow-lg"
            />
          </div>

          {/* Informations nutritionnelles */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Informations nutritionnelles</h2>
            
            {/* Note sur les portions */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Les valeurs nutritionnelles sont calculées pour {selectedPortions} {selectedPortions > 1 ? 'portions' : 'portion'} 
                ({Math.round(recipe.kcalPer100g * selectedPortions / recipe.portions)} kcal au total)
              </p>
            </div>

            {/* Nutri-Score */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Nutri-Score</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl
                  ${recipe.nutriscore === 'A' ? 'bg-green-500' :
                    recipe.nutriscore === 'B' ? 'bg-light-green-500' :
                    recipe.nutriscore === 'C' ? 'bg-yellow-500' :
                    recipe.nutriscore === 'D' ? 'bg-orange-500' :
                    'bg-red-500'}`}>
                  {recipe.nutriscore}
                </div>
                <span className="text-sm text-gray-600">
                  Qualité nutritionnelle {recipe.nutriscore === 'A' ? 'excellente' :
                    recipe.nutriscore === 'B' ? 'bonne' :
                    recipe.nutriscore === 'C' ? 'moyenne' :
                    recipe.nutriscore === 'D' ? 'médiocre' :
                    'mauvaise'}
                </span>
              </div>
            </div>

            {/* Valeurs principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-700">Calories</div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(recipe.kcalPer100g * selectedPortions / recipe.portions)} kcal
                </div>
                <div className="text-sm text-gray-500">
                  {recipe.kcalPer100g} kcal/100g
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-700">Protéines</div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(recipe.proteinsPer100g * selectedPortions / recipe.portions * 10) / 10}g
                </div>
                <div className="text-sm text-gray-500">
                  {recipe.proteinsPer100g}g/100g
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-700">Glucides</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {Math.round(recipe.carbohydratesPer100g * selectedPortions / recipe.portions * 10) / 10}g
                </div>
                <div className="text-sm text-gray-500">
                  {recipe.carbohydratesPer100g}g/100g
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-700">Lipides</div>
                <div className="text-2xl font-bold text-red-600">
                  {Math.round(recipe.lipidsPer100g * selectedPortions / recipe.portions * 10) / 10}g
                </div>
                <div className="text-sm text-gray-500">
                  {recipe.lipidsPer100g}g/100g
                </div>
              </div>
            </div>

            {/* Bouton pour afficher/masquer les détails */}
            <button
              onClick={() => setShowDetailedNutrition(!showDetailedNutrition)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <span className="font-semibold text-gray-700">Voir plus de détails nutritionnels</span>
              <svg
                className={`w-5 h-5 transform transition-transform duration-200 ${showDetailedNutrition ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Détails nutritionnels (volet dépliable) */}
            {showDetailedNutrition && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 animate-fadeIn">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-semibold text-gray-700">Acides gras saturés</div>
                  <div className="text-lg font-bold text-gray-800">
                    {Math.round(recipe.saturatedFattyAcidsPer100g * selectedPortions / recipe.portions * 10) / 10}g
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-semibold text-gray-700">Sucres</div>
                  <div className="text-lg font-bold text-gray-800">
                    {Math.round(recipe.simpleSugarsPer100g * selectedPortions / recipe.portions * 10) / 10}g
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-semibold text-gray-700">Fibres</div>
                  <div className="text-lg font-bold text-gray-800">
                    {Math.round(recipe.fibresPer100g * selectedPortions / recipe.portions * 10) / 10}g
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-semibold text-gray-700">Sel</div>
                  <div className="text-lg font-bold text-gray-800">
                    {Math.round(recipe.saltPer100g * selectedPortions / recipe.portions * 10) / 10}g
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-semibold text-gray-700">Fruits et légumes</div>
                  <div className="text-lg font-bold text-gray-800">
                    {Math.round((recipe.pnnsFruitPer100g + recipe.pnnsVegetablePer100g) * selectedPortions / recipe.portions * 10) / 10}g
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-semibold text-gray-700">Énergie</div>
                  <div className="text-lg font-bold text-gray-800">
                    {Math.round(recipe.kjPer100g * selectedPortions / recipe.portions)} kJ
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Étapes de la recette */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Préparation</h2>
            {recipe.steps.map((step, index) => {
              const stepIngredients = step.ingredients.filter(ingredientData => 
                ingredients.some(i => i.id === ingredientData.ingredient.id)
              );

              return (
                <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {step.order}
                    </div>
                    <div className="flex-grow">
                      {/* Type d'étape */}
                      <div className="mb-2">
                        <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                          {step.type === 'preparation' ? 'Préparation' : 
                           step.type === 'cooking' ? 'Cuisson' : 'Repos'}
                        </span>
                      </div>

                      {/* Ingrédients nécessaires */}
                      {stepIngredients.length > 0 && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">
                            Ingrédients nécessaires :
                          </h3>
                          <ul className="space-y-1">
                            {stepIngredients.map((ingredientData) => {
                              const ingredient = ingredients.find(i => i.id === ingredientData.ingredient.id);
                              if (!ingredient) return null;
                              
                              const displayName = ingredientData.quantity > 1 
                                ? (ingredient.displayPlural || ingredient.plural || ingredient.name)
                                : (ingredient.displayName || ingredient.name);
                              
                              return (
                                <li key={ingredientData.ingredient.id} className="flex items-center space-x-2 text-sm text-gray-600">
                                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                                  <span>
                                    {ingredientData.quantity} {getMeasurementUnit(ingredientData.unit.id)} {displayName}
                                    {ingredientData.notes && (
                                      <span className="text-gray-500 italic"> ({ingredientData.notes})</span>
                                    )}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {/* Texte principal */}
                      <p className="text-gray-700 mb-4">{step.text}</p>

                      {/* Sous-étapes */}
                      {step.subSteps && step.subSteps.length > 0 && (
                        <div className="mb-4 pl-4 border-l-2 border-blue-200">
                          <ul className="space-y-2">
                            {step.subSteps.map((subStep, subIndex) => (
                              <li key={subIndex} className="text-sm text-gray-600">
                                {subStep}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Notes */}
                      {step.notes && (
                        <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-yellow-800">{step.notes}</p>
                        </div>
                      )}

                      {/* Informations de cuisson */}
                      {(step.temperature || step.cookingTime) && (
                        <div className="mb-4 flex items-center space-x-4 text-sm text-gray-600">
                          {step.temperature && (
                            <span>🌡️ {step.temperature}°C</span>
                          )}
                          {step.cookingTime && (
                            <span>⏱️ {step.cookingTime} min</span>
                          )}
                        </div>
                      )}
                      
                      {/* Médias */}
                      {step.image && (
                        <img 
                          src={step.image} 
                          alt={step.imageAlt || `Étape ${step.order}`}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                      )}
                      
                      {step.video && (
                        <div className="aspect-w-16 aspect-h-9">
                          <video 
                            src={step.video} 
                            controls 
                            className="w-full rounded-lg"
                          />
                        </div>
                      )}

                      {/* Profil famille */}
                      {step.familyProfile && (
                        <div className="mt-4 flex items-center text-sm text-gray-500">
                          <span className="mr-2">
                            {step.familyProfile === 'adulte' ? '👨‍🍳' : '👶'}
                          </span>
                          <span>
                            {step.familyProfile === 'adulte' 
                              ? 'Étape pour adulte' 
                              : 'Étape adaptée aux enfants'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Colonne des ingrédients */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Ingrédients</h2>
            
            {/* Note sur les portions */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Quantités pour {selectedPortions} {selectedPortions > 1 ? 'portions' : 'portion'}
              </p>
            </div>

            {/* Liste des ingrédients */}
            <div className="space-y-4">
              {ingredients.map((ingredient) => {
                const adjustedIngredient = getAdjustedQuantity(ingredient, recipe.steps.flatMap(step => step.ingredients));
                if (!adjustedIngredient) return null;

                const displayName = adjustedIngredient.quantity > 1 
                  ? (ingredient.displayPlural || ingredient.plural || ingredient.name)
                  : (ingredient.displayName || ingredient.name);
                
                return (
                  <div key={ingredient.id} className="group relative">
                    {/* Carte principale */}
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      {/* Icône ou indicateur */}
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                        {ingredient.frozenOrCanned ? (
                          <span className="text-blue-500" title="Congelé/Conserve">❄️</span>
                        ) : ingredient.type === 'vegetable' ? (
                          <span className="text-green-500" title="Légume">🥬</span>
                        ) : ingredient.type === 'fruit' ? (
                          <span className="text-red-500" title="Fruit">🍎</span>
                        ) : ingredient.type === 'meat' ? (
                          <span className="text-red-600" title="Viande">🥩</span>
                        ) : ingredient.type === 'fish' ? (
                          <span className="text-blue-400" title="Poisson">🐟</span>
                        ) : (
                          <span className="text-gray-400">•</span>
                        )}
                      </div>

                      {/* Contenu principal */}
                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800">
                            {displayName}
                          </span>
                          {ingredient.withPork && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                              Porc
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {adjustedIngredient.quantity} {getMeasurementUnit(adjustedIngredient.unit.id)}
                        </div>
                      </div>
                    </div>

                    {/* Détails au survol */}
                    <div className="hidden group-hover:block absolute z-10 left-0 right-0 mt-1 p-3 bg-white rounded-lg shadow-lg border border-gray-200">
                      <div className="space-y-2">
                        {/* Type et saisons */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {ingredient.type}
                          </span>
                          {ingredient.seasons && ingredient.seasons.length > 0 && (
                            <span className="text-xs text-gray-500">
                              {ingredient.seasons.join(', ')}
                            </span>
                          )}
                        </div>

                        {/* Informations supplémentaires */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">Poids brut:</span>
                            <span className="text-gray-700">{ingredient.grossWeight}g</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">Rayon:</span>
                            <span className="text-gray-700">{ingredient.storeShelf}</span>
                          </div>
                        </div>

                        {/* Note sur le shopping list */}
                        {!ingredient.ignoreShoppingList && (
                          <div className="text-xs text-blue-600 mt-2">
                            À ajouter à la liste de courses
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note sur les ingrédients spéciaux */}
            {ingredients.some(i => i.withPork) && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800">
                  ⚠️ Cette recette contient des ingrédients avec du porc
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recipe; 