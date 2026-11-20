// Production and local development use the server unless demo is explicit.
export const dataMode = import.meta.env.VITE_DATA_MODE || 'api'
export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  'https://gdgoc2026a.up.railway.app/api/v1'
