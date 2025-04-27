let currentLang = 'en';  // Default language
let localizationData = {};  // Stores the current language's translations

/**
 * Load a new language JSON file and update the localization data.
 * @param {string} langCode - e.g., 'en', 'es', 'fr'
 */
async function loadLanguage(langCode) {
    try {
        // src\core\localization\en.json
        const response = await fetch(`src/core/localization/${langCode}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load language file: ${langCode}`);
        }
        localizationData = await response.json();
        currentLang = langCode;
        console.log(`Language switched to: ${currentLang}`);
    } catch (error) {
        console.error('Error loading language:', error);
    }
}

/**
 * Get the translated text for a given key.
 * @param {string} key - Translation key
 * @returns {string} - Translated string or the key itself if missing
 */
function t(key) {
    return localizationData[key] || key;
}

// Export the methods
export { loadLanguage, t };
