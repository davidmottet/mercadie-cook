import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Parse from '../parseConfig';

interface RecipeStep {
  order: number;
  text: string;
  image?: string;
  imageAlt?: string;
  familyProfile?: string;
  video?: string;
  ingredients: any[];
}

interface Recipe {
  id: string;
  name: string;
  slug: string;
  preparationTime: number;
  bakingTime: number;
  restTime: number;
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

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!slug) {
        setError('Slug de recette manquant');
        setLoading(false);
        return;
      }

      try {
        const query = new Parse.Query('Recipe');
        query.equalTo('slug', slug);
        const recipe = await query.first();
        
        if (!recipe) {
          setError('Recette non trouvée');
          setLoading(false);
          return;
        }

        // Récupérer les étapes de la recette
        const stepsQuery = new Parse.Query('RecipeStep');
        stepsQuery.equalTo('recipe', recipe);
        stepsQuery.ascending('order');
        const steps = await stepsQuery.find();

        setRecipe({
          id: recipe.id || '',
          name: recipe.get('name'),
          slug: recipe.get('slug'),
          preparationTime: recipe.get('preparationTime'),
          bakingTime: recipe.get('bakingTime'),
          restTime: recipe.get('restTime'),
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
            text: step.get('text'),
            image: step.get('image'),
            imageAlt: step.get('imageAlt'),
            familyProfile: step.get('familyProfile'),
            video: step.get('video'),
            ingredients: step.get('ingredients')
          }))
        });
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement de la recette');
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [slug]);

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* En-tête de la recette */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">{recipe.name}</h1>
        <div className="flex items-center space-x-4 text-gray-600">
          <span>⏱️ {recipe.preparationTime} min</span>
          {recipe.bakingTime > 0 && <span>🔥 {recipe.bakingTime} min</span>}
          {recipe.restTime > 0 && <span>⏳ {recipe.restTime} min</span>}
          <span>👥 {recipe.portions} portions</span>
        </div>
      </div>

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-700">Calories</div>
            <div className="text-2xl font-bold text-blue-600">{recipe.kcalPer100g} kcal</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-700">Protéines</div>
            <div className="text-2xl font-bold text-green-600">{recipe.proteinsPer100g}g</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-700">Glucides</div>
            <div className="text-2xl font-bold text-yellow-600">{recipe.carbohydratesPer100g}g</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-700">Lipides</div>
            <div className="text-2xl font-bold text-red-600">{recipe.lipidsPer100g}g</div>
          </div>
        </div>
      </div>

      {/* Étapes de la recette */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Préparation</h2>
        {recipe.steps.map((step, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                {step.order}
              </div>
              <div className="flex-grow">
                <p className="text-gray-700 mb-4">{step.text}</p>
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
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recipe; 