/**
 * Safe JSON parsing utility function
 * Handles non-JSON responses and parsing errors gracefully
 */
export const safeJsonParse = async (response, url) => {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error(`Non-JSON response from ${url}:`, {
            status: response.status,
            statusText: response.statusText,
            contentType,
            body: text.substring(0, 200) + (text.length > 200 ? '...' : '')
        });
        throw new Error(`Server returned ${response.status} ${response.statusText} - Expected JSON but got ${contentType}`);
    }
    try {
        return await response.json();
    }
    catch (error) {
        console.error(`Failed to parse JSON from ${url}:`, error);
        throw new Error(`Invalid JSON response from server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
