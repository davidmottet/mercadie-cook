import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Parse from '../parseConfig';

interface RecipePreview {
  id: string;
  name: string;
  slug: string;
  preparationTime: number;
  portions: number;
  image: string;
  imageAlt?: string;
  recipeCategory: string;
  express: boolean;
}

const RecipeList: React.FC = () => {
  const [recipes, setRecipes] = useState<RecipePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const query = new Parse.Query('Recipe');
        query.equalTo('published', true);
        query.equalTo('archived', false);
        query.ascending('name');
        const results = await query.find();

        setRecipes(results.map(recipe => ({
          id: recipe.id || '',
          name: recipe.get('name'),
          slug: recipe.get('slug'),
          preparationTime: recipe.get('preparationTime'),
          portions: recipe.get('portions'),
          image: recipe.get('image'),
          imageAlt: recipe.get('imageAlt'),
          recipeCategory: recipe.get('recipeCategory'),
          express: recipe.get('express')
        })));
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement des recettes');
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <div className="text-2xl text-gray-700">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <div className="text-2xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Nos Recettes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {recipes.map(recipe => (
          <Link 
            key={recipe.id} 
            to={`/recipe/${recipe.slug}`}
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            <div className="relative">
              <img 
                src={recipe.image} 
                alt={recipe.imageAlt || recipe.name}
                className="w-full h-48 object-cover"
              />
              {recipe.express && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Express
                </div>
              )}
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">{recipe.name}</h2>
              <div className="flex items-center space-x-4 text-gray-600">
                <span>⏱️ {recipe.preparationTime} min</span>
                <span>👥 {recipe.portions} portions</span>
              </div>
              <div className="mt-4">
                <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">
                  {recipe.recipeCategory}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecipeList; 