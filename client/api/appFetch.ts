export const appFetch = async <T>(path: string): Promise<T> => {
  const resp = await fetch(window.location.origin + path).then((r) => r.json());

  if (resp.error) throw new Error(resp.error);

  return resp;
};
