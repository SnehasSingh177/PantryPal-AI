import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Supported model configurations on Groq
const PRIMARY_MODEL = 'openai/gpt-oss-20b';
const FALLBACK_MODEL = 'openai/gpt-oss-120b';

// Supported Vision model configurations on Groq
const VISION_PRIMARY_MODEL = 'qwen/qwen3.8-27b';
const VISION_FALLBACK_MODEL = 'llama-3.2-11b-vision-preview';

const VALID_CATEGORIES = [
  'Produce',
  'Dairy & Eggs',
  'Meat & Seafood',
  'Bakery',
  'Pantry & Grains',
  'Canned & Packaged',
  'Snacks & Sweets',
  'Beverages',
  'Frozen',
  'Condiments & Spices',
  'Other'
];

const VALID_LOCATIONS = ['Fridge', 'Freezer', 'Pantry', 'Countertop'];

/**
 * Sanitizes a single detected grocery item into the schema structure
 */
function sanitizeSingleDetectedItem(rawItem, index = 0) {
  if (!rawItem || typeof rawItem !== 'object') {
    return null;
  }

  // Sanitize item name and avoid generic combinations
  let rawName = typeof rawItem.name === 'string' ? rawItem.name.trim() : '';
  if (!rawName || /^grocery\s+(assortment|bundle|mix|items)$/i.test(rawName)) {
    rawName = 'Grocery Item';
  }

  let category = 'Produce';
  if (rawItem.category) {
    const matchedCategory = VALID_CATEGORIES.find(
      (c) => c.toLowerCase() === String(rawItem.category).toLowerCase().trim()
    );
    if (matchedCategory) {
      category = matchedCategory;
    } else if (String(rawItem.category).toLowerCase().includes('fruit') || String(rawItem.category).toLowerCase().includes('vegetable')) {
      category = 'Produce';
    } else if (String(rawItem.category).toLowerCase().includes('milk') || String(rawItem.category).toLowerCase().includes('dairy') || String(rawItem.category).toLowerCase().includes('egg')) {
      category = 'Dairy & Eggs';
    } else if (String(rawItem.category).toLowerCase().includes('meat') || String(rawItem.category).toLowerCase().includes('fish') || String(rawItem.category).toLowerCase().includes('chicken')) {
      category = 'Meat & Seafood';
    } else if (String(rawItem.category).toLowerCase().includes('bread') || String(rawItem.category).toLowerCase().includes('bakery')) {
      category = 'Bakery';
    } else {
      category = 'Other';
    }
  }

  let storage_location = 'Fridge';
  if (rawItem.storage_location) {
    const matchedLoc = VALID_LOCATIONS.find(
      (l) => l.toLowerCase() === String(rawItem.storage_location).toLowerCase().trim()
    );
    if (matchedLoc) storage_location = matchedLoc;
  }

  const rawQty = parseFloat(rawItem.quantity);
  const quantity = !isNaN(rawQty) && rawQty > 0 ? rawQty : 1.0;
  const unit = typeof rawItem.unit === 'string' && rawItem.unit.trim() ? rawItem.unit.trim() : 'pcs';

  let daysToAdd = parseInt(rawItem.estimated_days);
  if (isNaN(daysToAdd) || daysToAdd <= 0) {
    if (category === 'Produce') daysToAdd = 7;
    else if (category === 'Dairy & Eggs') daysToAdd = 10;
    else if (category === 'Meat & Seafood') daysToAdd = 3;
    else if (category === 'Bakery') daysToAdd = 5;
    else daysToAdd = 14;
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysToAdd);
  const expiryDateString = expiryDate.toISOString().split('T')[0];

  const confidence = rawItem.confidence === 'Low' || rawItem.confidence === 'Medium'
    ? rawItem.confidence
    : 'High';

  const isUncertain = Boolean(rawItem.is_uncertain) || confidence === 'Low' || rawName === 'Grocery Item';

  return {
    id: `scan-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
    name: rawName,
    category,
    quantity,
    unit,
    storage_location,
    estimated_days: daysToAdd,
    expiry_date: expiryDateString,
    confidence,
    is_uncertain: isUncertain,
    price_per_unit: '',
    notes: rawItem.notes || `Detected via AI Vision (${rawName})`,
  };
}

/**
 * Attempts to repair truncated JSON arrays when model output reaches token limits
 */
function repairTruncatedJson(str) {
  if (!str || typeof str !== 'string') return null;
  const lastBraceIdx = str.lastIndexOf('}');
  if (lastBraceIdx !== -1) {
    const sub = str.substring(0, lastBraceIdx + 1);
    const attempts = [
      sub + '\n]}',
      sub + '\n}',
      sub + ']',
      sub
    ];
    for (const att of attempts) {
      try {
        const cleaned = att.replace(/,\s*([\]}])/g, '$1');
        const parsed = JSON.parse(cleaned);
        if (parsed) return parsed;
      } catch (e) {
        // try next attempt
      }
    }
  }
  return null;
}

/**
 * Safely parse JSON from grocery vision scan output into an array of distinct items
 */
function parseGroceryScanJson(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error('Received empty or invalid response from Groq Vision.');
  }

  let text = rawContent.trim();

  // If wrapped in markdown code fence anywhere in the string, extract the code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/i);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    // Try finding outermost JSON object or array
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      let candidate = jsonMatch[0];
      try {
        parsed = JSON.parse(candidate);
      } catch (e2) {
        // Try removing trailing commas before closing braces/brackets
        try {
          const cleanedCommas = candidate.replace(/,\s*([\]}])/g, '$1');
          parsed = JSON.parse(cleanedCommas);
        } catch (e3) {
          // Attempt truncation repair
          parsed = repairTruncatedJson(text);
        }
      }
    } else {
      // Attempt truncation repair directly
      parsed = repairTruncatedJson(text);
    }

    if (!parsed) {
      console.error('[groqService] Vision JSON parse failed on:', text);
      throw new Error('Failed to parse grocery detection result into JSON.');
    }
  }

  let rawList = [];
  if (parsed && Array.isArray(parsed.items)) {
    rawList = parsed.items;
  } else if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (parsed && typeof parsed === 'object') {
    rawList = [parsed];
  }

  // Filter out any combined assortment catch-all if multiple real items exist
  if (rawList.length > 1) {
    rawList = rawList.filter(
      (item) => !/^grocery\s+(assortment|bundle|mix|basket|box)$/i.test(item?.name || '')
    );
  }

  const items = rawList
    .map((item, idx) => sanitizeSingleDetectedItem(item, idx))
    .filter(Boolean);

  if (items.length === 0) {
    return [
      sanitizeSingleDetectedItem(
        { name: 'Grocery Item', confidence: 'Low', is_uncertain: true, notes: 'Please review detected item name and quantity' },
        0
      )
    ];
  }

  return items;
}

/**
 * Safely parse JSON from model output, handling optional markdown code fences
 */
function parseRecipeJson(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error('Received empty or invalid response from the AI recipe service.');
  }

  // Remove potential ```json ... ``` or ``` ... ``` wrappers
  const cleaned = rawContent
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    console.error('[groqService] JSON parse error on raw content:', rawContent);
    throw new Error('Failed to parse AI-generated recipe into valid JSON. Please try again.');
  }
}

export const groqService = {
  /**
   * Reads and validates the Groq API key securely from server environment
   */
  getGroqClient() {
    const apiKey = process.env.GROQ_API_KEY;
    if (
      !apiKey ||
      apiKey.trim() === '' ||
      apiKey.trim() === 'gsk_...' ||
      apiKey.includes('your_groq_api_key')
    ) {
      throw new Error(
        'GROQ_API_KEY is missing in server/.env. Please paste your free Groq API key from https://console.groq.com/keys into server/.env and restart the server.'
      );
    }
    // Instantiate Groq client securely without printing or logging the key
    return new Groq({ apiKey: apiKey.trim() });
  },

  /**
   * Generates a zero-waste recipe based on user's actual pantry ingredients
   * @param {Array} pantryItems - Array of pantry item objects { name, category, quantity, unit, expiry_date }
   * @param {Object} options - Optional preferences (e.g. mealType, dietaryPreference)
   */
  async generateRecipe(pantryItems, options = {}) {
    if (!pantryItems || !Array.isArray(pantryItems) || pantryItems.length === 0) {
      throw new Error('Your pantry has no ingredients. Please add groceries in the Pantry tab first.');
    }

    const groq = this.getGroqClient();

    // Format actual ingredients from Supabase, highlighting items approaching expiry
    const formattedIngredients = pantryItems
      .map((item) => {
        const expDate = item.expiry_date ? ` (Expiry: ${item.expiry_date})` : '';
        return `- ${item.name}: ${item.quantity || 1} ${item.unit || 'pcs'}${expDate} [${item.category || 'Pantry'}]`;
      })
      .join('\n');

    const systemPrompt = `You are Chef PantryPal, an expert culinary chef specialized in zero-waste home cooking.
Your goal is to create delicious, practical, and nutritious recipes that utilize ingredients the user already has in their pantry.
CRITICAL RULES:
1. Prioritize using ingredients that are closest to their expiration date.
2. The recipe MUST primarily use ingredients from the user's pantry list.
3. You may assume basic kitchen essentials are available: salt, black pepper, cooking oil, and water.
4. Keep the preparation steps clear, realistic, and easy to follow for home cooks.
5. Always respond strictly in valid JSON matching the exact schema requested without markdown blocks or conversational text.`;

    const userPrompt = `Here are the ingredients currently available in my pantry:
${formattedIngredients}

${options.mealType ? `Preferred Meal Type: ${options.mealType}` : ''}
${options.dietaryPreference ? `Dietary Preference: ${options.dietaryPreference}` : ''}

Generate a delicious recipe making the best use of these ingredients. Respond strictly with a JSON object in this exact format:
{
  "title": "string (Creative, appetizing recipe title)",
  "description": "string (Short 1-2 sentence appetizing overview of the dish and how it prevents waste)",
  "prep_time": "string (e.g. '15 mins')",
  "cook_time": "string (e.g. '20 mins')",
  "servings": 2,
  "difficulty": "Easy" | "Medium" | "Advanced",
  "pantry_items_used": ["string", "string"],
  "ingredients": [
    { "item": "string", "amount": "string" }
  ],
  "instructions": [
    "Step 1: ...",
    "Step 2: ..."
  ],
  "chef_tip": "string (A practical tip on cooking technique or preserving leftovers)"
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      // Primary model: openai/gpt-oss-20b
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: PRIMARY_MODEL,
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const recipe = parseRecipeJson(chatCompletion.choices[0]?.message?.content);

      if (!recipe.title || !recipe.ingredients || !recipe.instructions) {
        throw new Error('Generated recipe format was incomplete. Missing required recipe fields.');
      }

      return recipe;
    } catch (err) {
      console.error(`[groqService.generateRecipe] Primary model (${PRIMARY_MODEL}) error:`, err.message || err);

      // Handle invalid credentials
      if (err.status === 401 || err.message?.includes('Invalid API Key')) {
        throw new Error(
          'AI service configuration error. Please verify your server setup.'
        );
      }

      // Handle rate limits
      if (err.status === 429) {
        throw new Error(
          'Recipe generation is busy right now. Please wait a few seconds before trying again.'
        );
      }

      // Fallback model if primary model is unavailable or rate-limited
      if (
        err.status === 404 ||
        err.message?.includes('model') ||
        err.message?.includes('decommissioned') ||
        err.message?.includes('not_found')
      ) {
        console.log(`[groqService] Attempting fallback model: ${FALLBACK_MODEL}...`);
        try {
          const fallbackCompletion = await groq.chat.completions.create({
            messages,
            model: FALLBACK_MODEL,
            temperature: 0.7,
            max_tokens: 1500,
            response_format: { type: 'json_object' },
          });

          const fallbackRecipe = parseRecipeJson(fallbackCompletion.choices[0]?.message?.content);

          if (!fallbackRecipe.title || !fallbackRecipe.ingredients || !fallbackRecipe.instructions) {
            throw new Error('Generated recipe format was incomplete.');
          }

          return fallbackRecipe;
        } catch (fallbackErr) {
          console.error(`[groqService Fallback Error (${FALLBACK_MODEL})]:`, fallbackErr.message || fallbackErr);
          throw new Error('AI recipe service is temporarily unavailable. Please try again in a moment.');
        }
      }

      throw err;
    }
  },

  /**
   * Scans a grocery or packaged food image using Groq Vision API
   * @param {string} imageDataUrl - Base64 data URL of the uploaded or captured image
   * @returns {Promise<Object>} Detected item details { name, category, quantity, unit, storage_location, estimated_days, expiry_date, confidence, notes }
   */
  async scanGrocery(imageDataUrl) {
    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      throw new Error('Please provide a valid image string or data URL.');
    }

    const groq = this.getGroqClient();

    // Ensure format is data URL
    let formattedImageUrl = imageDataUrl.trim();
    if (!formattedImageUrl.startsWith('data:image/')) {
      formattedImageUrl = `data:image/jpeg;base64,${formattedImageUrl}`;
    }

    const systemPrompt = `You are an expert AI grocery scanner and pantry inventory vision system.
Analyze the provided image and detect EVERY INDIVIDUALLY IDENTIFIABLE GROCERY PRODUCT.

CRITICAL RULES:
1. DETECT EVERY DISTINCT PRODUCT: Identify every individual item, fresh produce, packaged grocery, condiment, dairy, beverage, bakery, or meat product visible in the image.
2. NEVER COMBINE MULTIPLE ITEMS: NEVER combine distinct products into a single grocery item, generic group, or names like "Grocery Assortment", "Assorted Groceries", "Produce Mix", "Food Basket", or "Groceries". Every identifiable product MUST be its own separate entry in the "items" array.
3. If an image contains 5 fruits, return 5 distinct items (e.g. "Pineapple", "Papaya", "Red Grapes", "Lemons", "Oranges").
4. ACCURACY & UNCERTAINTY: Do not invent exact quantities or product names when they cannot be clearly identified. If an item or quantity is partially obscured or uncertain, provide your best realistic estimate, set "confidence": "Low" or "Medium", set "is_uncertain": true, and add a brief explanatory note in "notes" (e.g., "Uncertain quantity, please verify").
5. Categories strictly:
- Produce
- Dairy & Eggs
- Meat & Seafood
- Bakery
- Pantry & Grains
- Canned & Packaged
- Snacks & Sweets
- Beverages
- Frozen
- Condiments & Spices
- Other

6. Storage locations strictly:
- Fridge
- Freezer
- Pantry
- Countertop

7. Common units: "pcs", "kg", "g", "liters", "packs", "cans", "bottles", "bunch", "boxes"

OUTPUT FORMAT:
Respond strictly with a JSON object containing an "items" array (no markdown code blocks, no conversational preamble):
{
  "items": [
    {
      "name": "string (concise product name, e.g. 'Gala Apples')",
      "category": "one of the valid categories above",
      "quantity": number (numeric count or estimate, e.g. 1, 2, 4),
      "unit": "string (e.g. 'pcs', 'kg', 'g', 'liters', 'packs', 'cans', 'bottles')",
      "storage_location": "Fridge" | "Freezer" | "Pantry" | "Countertop",
      "estimated_days": number (estimated realistic shelf life in days from today, e.g. 5 for milk, 7 for apples, 3 for fish, 30 for canned goods),
      "confidence": "High" | "Medium" | "Low",
      "is_uncertain": boolean,
      "notes": "string"
    }
  ]
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Detect all individually identifiable grocery products in this image. Return every product as a separate object in the "items" array in JSON format. Do not combine them into "Grocery Assortment" or generic bundles.',
          },
          { type: 'image_url', image_url: { url: formattedImageUrl } },
        ],
      },
    ];

    try {
      const completion = await groq.chat.completions.create({
        model: VISION_PRIMARY_MODEL,
        messages,
        max_tokens: 800,
        temperature: 0.1,
      });

      const raw = completion.choices[0]?.message?.content;
      return parseGroceryScanJson(raw);
    } catch (err) {
      console.error(`[groqService.scanGrocery] Primary vision model (${VISION_PRIMARY_MODEL}) error:`, err.message || err);

      if (err.status === 401 || err.message?.includes('Invalid API Key')) {
        throw new Error('AI service configuration error. Please verify your server setup.');
      }
      if (err.status === 429) {
        throw new Error('Image scanner is busy right now. Please wait a few seconds before scanning again.');
      }

      // Try fallback vision model if primary model is unavailable
      if (err.status === 404 || err.message?.includes('model') || err.message?.includes('not_found')) {
        console.log(`[groqService] Attempting fallback vision model: ${VISION_FALLBACK_MODEL}...`);
        try {
          const fallbackCompletion = await groq.chat.completions.create({
            model: VISION_FALLBACK_MODEL,
            messages,
            max_tokens: 800,
            temperature: 0.1,
          });
          const raw = fallbackCompletion.choices[0]?.message?.content;
          return parseGroceryScanJson(raw);
        } catch (fallbackErr) {
          console.error('[groqService Fallback Vision Error]:', fallbackErr.message || fallbackErr);
        }
      }

      throw new Error(err.message || 'Unable to analyze grocery image. Please try another angle or photo.');
    }
  }
};
