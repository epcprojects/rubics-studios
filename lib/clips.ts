// Voice recordings live in memory for the session. A real build uploads them to file storage.
const urls = new Map<string, string>();

export const clipUrl = (id: string) => urls.get(id);
export const setClipUrl = (id: string, url: string) => urls.set(id, url);
