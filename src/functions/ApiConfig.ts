/**
 * Resolves the backend API URL dynamically based on the environment.
 * In development, points to the local Express server on port 3006.
 * In production, uses relative paths since the static React app is served by the Express server itself.
 * 
 * @param path The API endpoint path (e.g., "/api/bot/chat" or "/text-to-speech")
 * @returns The fully qualified API URL or relative path
 */
export const getApiUrl = (path: string): string => {
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:3006${path}`;
  }
  return path;
};
