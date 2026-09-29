import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Flame, Users, ChefHat, CheckCircle2, Sparkles, Lightbulb } from 'lucide-react';

export const RecipeDetailModal = ({ isOpen, onClose, recipe }) => {
  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !recipe || typeof document === 'undefined') return null;

  const ingredientsList = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const instructionsList = Array.isArray(recipe.instructions) ? recipe.instructions : [];
  const pantryUsed = Array.isArray(recipe.pantry_items_used) ? recipe.pantry_items_used : [];

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto bg-kawaii-espresso/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop to dismiss on outside click */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 bg-[#FFFDF9] rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-[#EADDC7] flex flex-col my-auto max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Subtle decorative tape */}
        <div className="washi-tape-peach -top-2.5 left-10 hidden sm:block">Chef's Recipe Pin 📌</div>

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#EADDC7] bg-[#FFF9EF]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-[#315C45]/20 shadow-xs shrink-0 bg-white">
              <img
                src="/assets/3d_chef_strawberry.jpg"
                alt="Chef Pal"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-[#1E2E24] leading-tight">
                {recipe.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#315C45] font-bold mt-0.5">AI Chef Organic Recipe • Zero Waste 🍲</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-[#66736A] hover:text-[#1E2E24] hover:bg-[#EADDC7]/40 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Metrics Strip */}
          <div className="flex flex-wrap items-center gap-2.5">
            {recipe.prep_time && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-kawaii-mint/60 text-kawaii-forest border border-kawaii-forest/20 shadow-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>Prep: {recipe.prep_time}</span>
              </span>
            )}
            {recipe.cook_time && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-kawaii-butter/40 text-[#8A5B10] border border-[#E2BC55]/40 shadow-xs">
                <Flame className="w-3.5 h-3.5" />
                <span>Cook: {recipe.cook_time}</span>
              </span>
            )}
            {recipe.servings && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-kawaii-lavender/70 text-[#583C80] border border-[#D4C3EE]/60 shadow-xs">
                <Users className="w-3.5 h-3.5" />
                <span>Serves: {recipe.servings}</span>
              </span>
            )}
            {recipe.difficulty && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#DCEBDD] text-[#315C45] border border-[#c2dec5] shadow-xs">
                Difficulty: {recipe.difficulty}
              </span>
            )}
          </div>

          {/* Description */}
          {recipe.description && (
            <p className="text-sm sm:text-base text-[#343A35] leading-relaxed bg-[#FFFDF9] p-4 rounded-2xl border border-kawaii-border font-normal">
              {recipe.description}
            </p>
          )}

          {/* Pantry Items Rescued */}
          {pantryUsed.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-kawaii-forest uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-kawaii-forest" />
                <span>Ingredients Rescued from Your Pantry 🌱</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {pantryUsed.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-full text-xs font-bold bg-kawaii-mint/60 text-kawaii-forest border border-kawaii-forest/20 shadow-xs"
                  >
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Complete Ingredients List */}
          <div>
            <h4 className="text-xs font-bold text-kawaii-espresso uppercase tracking-wider mb-3">
              Ingredients & Quantities
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ingredientsList.map((ing, idx) => {
                const itemName = typeof ing === 'string' ? ing : ing.item || ing.name;
                const amount = typeof ing === 'object' ? ing.amount || ing.quantity : '';
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white border border-kawaii-border flex items-center justify-between text-xs shadow-xs"
                  >
                    <span className="font-bold text-kawaii-espresso">{itemName}</span>
                    {amount && <span className="font-bold text-[#315C45] ml-2 bg-[#DCEBDD]/60 px-2.5 py-0.5 rounded-full border border-[#c2dec5]">{amount}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div>
            <h4 className="text-xs font-bold text-kawaii-espresso uppercase tracking-wider mb-3">
              Step-by-Step Cooking Instructions
            </h4>
            <ol className="space-y-3">
              {instructionsList.map((step, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-kawaii-border text-sm text-[#343A35] leading-relaxed shadow-xs"
                >
                  <span className="shrink-0 w-6 h-6 rounded-full bg-kawaii-forest text-white font-bold flex items-center justify-center text-xs shadow-xs">
                    {idx + 1}
                  </span>
                  <span className="pt-0.5">{typeof step === 'string' ? step.replace(/^\d+[\.\)]\s*/, '') : step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Chef's Tip */}
          {recipe.chef_tip && (
            <div className="p-4 rounded-2xl bg-kawaii-butter/30 border border-[#E2BC55]/40 text-[#6B460C] text-xs flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-[#8A5B10] shrink-0 mt-0.5" />
              <div>
                <p className="font-display font-bold text-[#6B460C] text-sm mb-0.5">Chef's Waste-Saving Tip 💡</p>
                <p className="text-[#8A5B10] leading-relaxed">{recipe.chef_tip}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end px-6 py-4 border-t border-kawaii-border/60 bg-kawaii-cream/80">
          <button
            type="button"
            onClick={onClose}
            className="btn-primary text-xs px-6 py-2.5 cursor-pointer font-semibold"
          >
            Done Cooking! 👨‍🍳
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

