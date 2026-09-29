import { supabase } from './supabaseClient';

export const recipeService = {
  /**
   * Calls the backend API proxy to generate a recipe with Groq AI using actual pantry ingredients
   */
  async generateRecipe(pantryItems, options = {}) {
    if (!pantryItems || pantryItems.length === 0) {
      throw new Error('Your pantry is empty. Please add items in the Pantry tab first.');
    }

    // Extract relevant fields to keep payload concise
    const cleanItems = pantryItems.map((item) => ({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      expiry_date: item.expiry_date,
    }));

    const response = await fetch('/api/recipes/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pantryItems: cleanItems,
        options,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate recipe. Please try again.');
    }

    return data.recipe;
  },

  /**
   * Fetch all saved recipes for the authenticated user from Supabase
   */
  async getSavedRecipes(userId) {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('saved_recipes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[recipeService.getSavedRecipes] Error:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Save a newly generated recipe into Supabase
   */
  async saveRecipe(recipe, userId) {
    if (!userId) {
      throw new Error('User ID is required to save recipe.');
    }

    const payload = {
      user_id: userId,
      title: recipe.title,
      description: recipe.description || '',
      prep_time: recipe.prep_time || '15 mins',
      cook_time: recipe.cook_time || '20 mins',
      servings: recipe.servings || 2,
      difficulty: recipe.difficulty || 'Easy',
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      pantry_items_used: recipe.pantry_items_used || [],
      chef_tip: recipe.chef_tip || null,
    };

    const { data, error } = await supabase
      .from('saved_recipes')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('[recipeService.saveRecipe] Error:', error);
      throw error;
    }

    return data;
  },

  /**
   * Delete a saved recipe from Supabase
   */
  async deleteRecipe(recipeId, userId) {
    if (!recipeId || !userId) {
      throw new Error('Recipe ID and User ID are required.');
    }

    const { error } = await supabase
      .from('saved_recipes')
      .delete()
      .eq('id', recipeId)
      .eq('user_id', userId);

    if (error) {
      console.error('[recipeService.deleteRecipe] Error:', error);
      throw error;
    }

    return true;
  }
};
