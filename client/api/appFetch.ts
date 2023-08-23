export const appFetch = async <T extends object>(path: string): Promise<T> => {
  const resp = await fetch(window.location.origin + path).then(
    (r) => r.json() as Promise<T | { error: string }>
  );

  if ("error" in resp) throw new Error(resp.error);

  return resp;
};
