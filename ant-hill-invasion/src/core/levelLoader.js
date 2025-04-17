/**
 * Asynchronously loads level data from a JSON file.
 * @param {string} levelId - The ID of the level to load (e.g., "level1").
 * @returns {Promise<object>} A promise that resolves with the parsed level data.
 * @throws {Error} If the level file cannot be fetched or parsed.
 */
export async function loadLevelData(levelId) {
    const levelPath = `/levels/${levelId}.json`;
    try {
        const response = await fetch(levelPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for level ${levelId}`);
        }
        const levelData = await response.json();
        console.log(`Loaded level data for ${levelId}:`, levelData);
        return levelData;
    } catch (error) {
        console.error(`Failed to load level data for ${levelId}:`, error);
        throw error; // Re-throw the error to be handled by the caller
    }
} 