import { TileJSON } from '@/types';

// For some reason axios is throwing CORS error. So using the native fetch works.
export const getTMSTileJSON = async (url: string): Promise<TileJSON> => {
  const res = await fetch(url);
  return res.json();
};
