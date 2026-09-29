/**
 * Service to interact with the PantryPal AI Vision API backend
 */

export const visionService = {
  /**
   * Scan grocery image using Groq Vision
   * @param {string} imageDataUrl - Base64 Data URL or string of the image
   * @returns {Promise<Object>} Detected item details
   */
  async scanGrocery(imageDataUrl) {
    if (!imageDataUrl) {
      throw new Error('Please select or capture a grocery image to scan.');
    }

    const response = await fetch('/api/vision/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageDataUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to analyze grocery image.');
    }

    if (Array.isArray(data.items)) {
      return data.items;
    }
    if (Array.isArray(data.item)) {
      return data.item;
    }
    if (data.item) {
      return [data.item];
    }
    return [];
  },
};
