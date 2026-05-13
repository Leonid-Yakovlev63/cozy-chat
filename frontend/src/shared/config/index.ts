/** Базовый URL API. В dev оставьте пустым — запросы идут на тот же origin, Vite проксирует `/api` на backend. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
