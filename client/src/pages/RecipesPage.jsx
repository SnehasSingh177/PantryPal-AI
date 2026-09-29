import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChefHat,
  Sparkles,
  Clock,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Package,
  BookOpen,
  Heart,
  Flame,
  Search,
  SlidersHorizontal,
  UtensilsCrossed
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePantry } from '../context/PantryContext';
import { recipeService } from '../services/recipeService';
import { RecipeDetailModal } from '../components/recipes/RecipeDetailModal';
import {
  AvocadoDoodle,
  StrawberryDoodle,
  LemonDoodle,
  CarrotDoodle,
  SparkleStarDoodle
} from '../components/common/KawaiiDoodles';

// Curated high-res aesthetic Pinterest food photography to pair with AI recipes
const PINTEREST_FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', // Vibrant nourish bowl
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', // Rainbow garden salad
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80', // Artisan rustic pasta
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', // Fresh green avocado salad
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80', // Gourmet wholesome meal
  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80', // Cozy vegetable soup bowl
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', // Colorful dinner spread
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80', // Farm-to-table veggies
];

export const RecipesPage = () => {
  const { user } = useAuth();
  const { items } = usePantry();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'quick', 'medium'

  // Active items currently in user's pantry
  const activePantryItems = items.filter((i) => i.status === 'active');

  // Load saved recipes from Supabase
  const loadSavedRecipes = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await recipeService.getSavedRecipes(user.id);
      setRecipes(data);
    } catch (err) {
      console.error('[RecipesPage] Failed to load saved recipes:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSavedRecipes();
  }, [loadSavedRecipes]);

  // Handle Generate New Recipe
  const handleGenerateRecipe = async () => {
    setError('');
    setSuccessMsg('');

    if (activePantryItems.length === 0) {
      setError(
        'Your pantry is empty! Please add groceries in the Pantry Inventory tab first so Chef Pal knows what you can cook with.'
      );
      return;
    }

    setGenerating(true);

    try {
      // 1. Call backend AI route with real pantry items
      const generatedRecipe = await recipeService.generateRecipe(activePantryItems);

      // 2. Persist newly generated recipe
      let finalRecipe = generatedRecipe;
      if (user?.id) {
        try {
          const saved = await recipeService.saveRecipe(generatedRecipe, user.id);
          finalRecipe = saved;
        } catch (dbErr) {
          console.warn('Could not save recipe, showing in memory:', dbErr);
        }
      }

      // 3. Prepend to recipes list without removing existing ones
      setRecipes((prev) => [finalRecipe, ...prev]);
      setSuccessMsg(`Chef Pal created "${finalRecipe.title}"! Click "Let's Cook!" to see step-by-step instructions.`);
    } catch (err) {
      console.error('[handleGenerateRecipe] Error:', err);
      setError(err.message || 'Failed to generate recipe. Please try again in a moment.');
    } finally {
      setGenerating(false);
    }
  };

  // Handle Delete Recipe
  const handleDeleteRecipe = async (recipeId) => {
    if (!user?.id || !recipeId) return;
    try {
      await recipeService.deleteRecipe(recipeId, user.id);
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
    } catch (err) {
      console.error('Delete recipe error:', err);
    }
  };

  // Helper to determine photo for each card
  const getRecipePhoto = (recipe, index) => {
    if (recipe.image_url) return recipe.image_url;
    return PINTEREST_FOOD_IMAGES[index % PINTEREST_FOOD_IMAGES.length];
  };

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchesSearch =
        searchFilter === '' ||
        r.title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchFilter.toLowerCase());

      if (!matchesSearch) return false;

      if (timeFilter === 'quick') {
        const prep = parseInt(r.prep_time, 10);
        return !isNaN(prep) ? prep <= 20 : true;
      }

      return true;
    });
  }, [recipes, searchFilter, timeFilter]);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Pinterest Inspiration Hero Banner */}
      <div className="card-pinterest p-6 sm:p-8 bg-gradient-to-br from-[#FFFDF9] via-[#FFF9EF] to-[#F3C7AE]/20 border-2 border-[#EADDC7] relative overflow-hidden">
        {/* Subtle decorative tape */}
        <div className="washi-tape-peach -top-2.5 left-10 hidden sm:block">Moodboard Pin 📌</div>
        <div className="washi-tape-sage -bottom-2.5 right-12 hidden sm:block">Zero-Waste Kitchen ✨</div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* 3D Chef Strawberry Mascot Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden border-3 border-[#D97B5B]/30 shadow-md bg-white">
                <img
                  src="/assets/3d_chef_strawberry.jpg"
                  alt="3D Chef Pal"
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform"
                />
              </div>
              <span className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#F4D98A] border-2 border-white flex items-center justify-center text-xs shadow-sm">
                👩‍🍳
              </span>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#315C45]/10 text-[#315C45] text-xs font-display font-bold mb-1.5">
                <SparkleStarDoodle className="w-3.5 h-3.5" fill="#315C45" />
                <span>Pinterest Food Inspiration • Zero-Waste Chef</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-[#1E2E24] tracking-tight">
                AI Recipe Inspiration Board
              </h1>
              <p className="text-sm sm:text-base text-[#343A35] mt-1 font-display font-normal max-w-xl">
                Transform ingredients sitting in your pantry into aesthetic, delicious meals before they spoil.
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            <button
              onClick={handleGenerateRecipe}
              disabled={generating}
              className="btn-terracotta text-sm px-6 py-3.5 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 font-semibold shadow-md w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4 text-[#F4D98A]" />
              <span>{generating ? 'Whisking Ingredients...' : 'Surprise Me!'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Cooking Loader Overlay / Banner */}
      {generating && (
        <div className="p-8 rounded-3xl bg-[#FFFDF9] border-2 border-[#F4D98A] shadow-pinterest-card text-center flex flex-col items-center justify-center animate-fade-in py-10 relative overflow-hidden">
          <div className="washi-tape-butter -top-2.5 mx-auto">Cooking Magic ✨</div>
          <div className="relative mb-4 mt-2">
            <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-[#F4D98A] shadow-md mx-auto">
              <img
                src="/assets/3d_recipe_bowl.jpg"
                alt="Cooking up recipe"
                className="w-full h-full object-cover animate-pulse"
              />
            </div>
            <div className="absolute -top-2 -right-2 animate-bounce">
              <SparkleStarDoodle className="w-6 h-6" fill="#D97B5B" />
            </div>
          </div>
          <h3 className="text-xl font-display font-bold text-[#1E2E24] flex items-center gap-2">
            <span>Chef Pal is cooking up a delicious idea...</span>
            <span className="text-base animate-pulse">🍳</span>
          </h3>
          <p className="text-sm text-[#343A35] mt-1.5 max-w-md font-display font-medium">
            Tasting your {activePantryItems.length} active ingredients and crafting an easy, zero-waste recipe to rescue expiring groceries first!
          </p>
        </div>
      )}

      {/* Alert / Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-[#FEE8E2] border-2 border-[#F8C8BD] text-[#C05435] text-xs sm:text-sm flex items-start gap-3 shadow-sm animate-fade-in font-display">
          <AlertCircle className="w-5 h-5 text-[#C05435] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-[#A8381D] mb-0.5">Chef Notice</p>
            <p className="leading-relaxed">{error}</p>
            {activePantryItems.length === 0 && (
              <Link
                to="/pantry"
                className="inline-flex items-center gap-1.5 font-bold text-[#A8381D] underline mt-2 hover:text-[#7A2410]"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Go to Pantry Inventory to add groceries</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
          <button
            onClick={() => setError('')}
            className="text-[#C05435] hover:text-[#7A2410] font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Banner */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#DCEBDD] border-2 border-[#c2dec5] text-[#315C45] text-xs sm:text-sm flex items-start justify-between gap-3 shadow-sm animate-fade-in font-display">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#315C45] shrink-0" />
            <span className="font-bold">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg('')}
            className="text-[#315C45] hover:text-[#1E2E24] font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Pantry Ingredients Strip & Moodboard Toolbar */}
      <div className="card-pinterest p-5 bg-[#FFFDF9] border border-[#EADDC7] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Ingredients Quick Glance */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#DCEBDD] text-[#315C45] flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
            🥗
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-display font-bold text-[#1E2E24] uppercase tracking-wider">
                Available Pantry Ingredients ({activePantryItems.length})
              </h4>
              <Link
                to="/pantry"
                className="text-xs font-semibold text-[#315C45] hover:underline"
              >
                (Edit)
              </Link>
            </div>
            <p className="text-xs text-[#343A35] font-display font-medium mt-0.5 line-clamp-1">
              {activePantryItems.length > 0
                ? activePantryItems.map((i) => i.name).slice(0, 7).join(', ') +
                  (activePantryItems.length > 7 ? ` +${activePantryItems.length - 7} more` : '')
                : 'No groceries logged in your pantry yet.'}
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#66736A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-full text-xs bg-white border border-[#EADDC7] text-[#1E2E24] placeholder-[#66736A] focus:outline-none focus:border-[#315C45] font-display w-36 sm:w-48"
            />
          </div>

          <button
            onClick={() => setTimeFilter((prev) => (prev === 'all' ? 'quick' : 'all'))}
            className={`px-3 py-1.5 rounded-full text-xs font-display font-bold transition-all cursor-pointer border ${
              timeFilter === 'quick'
                ? 'bg-[#315C45] text-white border-[#315C45]'
                : 'bg-white text-[#343A35] border-[#EADDC7] hover:border-[#315C45]'
            }`}
          >
            ⚡ Quick (≤20m)
          </button>
        </div>
      </div>

      {/* Recipes Pinterest Grid */}
      {loading ? (
        <div className="p-16 text-center">
          <div className="w-16 h-16 rounded-3xl overflow-hidden border-2 border-[#EADDC7] mx-auto mb-3 shadow-sm">
            <img
              src="/assets/3d_recipe_bowl.jpg"
              alt="Loading"
              className="w-full h-full object-cover animate-spin"
            />
          </div>
          <p className="text-sm font-display font-semibold text-[#1E2E24]">Curating your Pinterest recipe board...</p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        /* Aesthetic Pinterest Empty State */
        <div className="card-pinterest p-12 text-center max-w-md mx-auto flex flex-col items-center bg-[#FFFDF9] border-2 border-[#EADDC7]">
          <div className="w-24 h-24 rounded-3xl overflow-hidden border-3 border-[#D97B5B]/30 shadow-md mb-4 bg-white">
            <img
              src="/assets/3d_recipe_bowl.jpg"
              alt="No recipes yet"
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="font-display font-bold text-2xl text-[#1E2E24] mb-1.5">
            {recipes.length === 0 ? 'Your Recipe Moodboard is Empty' : 'No matching recipes found'}
          </h3>
          <p className="text-sm text-[#343A35] mb-6 leading-relaxed font-display font-normal">
            {recipes.length === 0
              ? 'Click "Surprise Me!" and Chef Pal will scan your pantry items and craft an aesthetic, zero-waste meal!'
              : 'Try clearing your search filter to see all your saved recipe pins.'}
          </p>
          {recipes.length === 0 ? (
            <button
              onClick={handleGenerateRecipe}
              disabled={generating}
              className="btn-terracotta text-sm px-7 py-3.5 flex items-center gap-2 cursor-pointer font-semibold shadow-md"
            >
              <Sparkles className="w-4 h-4 text-[#F4D98A]" />
              <span>Surprise Me!</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchFilter('');
                setTimeFilter('all');
              }}
              className="btn-secondary text-xs px-5 py-2.5 font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        /* Pinterest Inspiration Board Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {filteredRecipes.map((recipe, index) => {
            const pantryUsed = Array.isArray(recipe.pantry_items_used) ? recipe.pantry_items_used : [];
            const photoUrl = getRecipePhoto(recipe, index);
            const tapeVariant =
              index % 3 === 0
                ? 'washi-tape-peach'
                : index % 3 === 1
                ? 'washi-tape-sage'
                : 'washi-tape-butter';

            return (
              <div
                key={recipe.id || index}
                className="card-pinterest flex flex-col justify-between overflow-hidden bg-white border-2 border-[#EADDC7]/80 hover:border-[#315C45] hover:shadow-pinterest-hover hover:-translate-y-1.5 transition-all duration-200 group relative"
              >
                {/* Washi Tape Top Accent */}
                <div className={`${tapeVariant} -top-2.5 right-6 text-[10px] hidden sm:block`}>
                  Pinned ✨
                </div>

                <div>
                  {/* Large Pinterest Food Image */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#FFF9EF] border-b border-[#EADDC7]/70">
                    <img
                      src={photoUrl}
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Gradient overlay for text protection */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />

                    {/* Floating Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-[#1E2E24] bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full shadow-sm border border-white/40">
                        <Clock className="w-3.5 h-3.5 text-[#315C45]" />
                        <span>{recipe.prep_time || '15 mins'}</span>
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="text-xs font-display font-bold px-2.5 py-1 rounded-full bg-[#FFF9EF]/95 backdrop-blur-xs text-[#315C45] border border-[#EADDC7] shadow-sm">
                        {recipe.difficulty || 'Easy'}
                      </span>
                    </div>

                    {/* Quick Servings Pill at bottom of image */}
                    {recipe.servings && (
                      <div className="absolute bottom-2.5 left-3">
                        <span className="text-[11px] font-display font-bold text-white/90 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-white/20">
                          🍽️ {recipe.servings} servings
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body Content */}
                  <div className="p-5">
                    <h3 className="text-lg sm:text-xl font-display font-bold text-[#1E2E24] mb-2 leading-snug group-hover:text-[#315C45] transition-colors">
                      {recipe.title}
                    </h3>

                    <p className="text-sm text-[#343A35] line-clamp-2 mb-4 leading-relaxed font-display font-normal">
                      {recipe.description || 'A delicious homemade recipe utilizing pantry ingredients before expiry.'}
                    </p>

                    {/* Rescued Ingredients Pills */}
                    {pantryUsed.length > 0 && (
                      <div className="pt-3 border-t border-[#EADDC7]/70 font-display">
                        <span className="text-xs text-[#66736A] font-medium block mb-1.5">
                          Rescued from your pantry:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {pantryUsed.slice(0, 3).map((item, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#DCEBDD] text-[#315C45] border border-[#c2dec5]"
                            >
                              ✓ {item}
                            </span>
                          ))}
                          {pantryUsed.length > 3 && (
                            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-[#FFF9EF] text-[#315C45] border border-[#EADDC7]">
                              +{pantryUsed.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-5 pt-0 mt-2 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedRecipe(recipe)}
                    className="flex-1 btn-primary text-xs sm:text-sm py-2.5 px-4 flex items-center justify-center gap-2 cursor-pointer font-semibold shadow-xs"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Let's Cook!</span>
                  </button>

                  {recipe.id && (
                    <button
                      onClick={() => handleDeleteRecipe(recipe.id)}
                      title="Delete recipe pin"
                      className="p-2.5 rounded-2xl text-[#66736A] hover:text-[#C05435] hover:bg-[#FEE8E2] border border-transparent hover:border-[#F8C8BD] transition-all cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        isOpen={Boolean(selectedRecipe)}
        onClose={() => setSelectedRecipe(null)}
        recipe={selectedRecipe}
      />
    </div>
  );
};

