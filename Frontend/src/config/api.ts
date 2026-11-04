/**
 * Global API configuration.
 * Automatically determines the API host based on window.location.hostname
 * so that it works seamlessly both on localhost and when accessed on a remote server/IP.
 * Can be overridden by setting VITE_API_URL in a .env file.
 */
const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  const hostname = (typeof window !== 'undefined' && window.location && window.location.hostname)
    ? window.location.hostname
    : 'localhost';
  const protocol = (typeof window !== 'undefined' && window.location && window.location.protocol)
    ? window.location.protocol
    : 'http:';
  return `${protocol}//${hostname}:8004`;
};

export const API_BASE_URL = getApiBaseUrl();
