const omitObjectKey = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = {} as Record<string, any>;
  (Object.keys(obj) as Array<K>).forEach((key) => {
    if (!keys.includes(key)) {
      result[key as unknown as string] = obj[key];
    }
  });

  return result as unknown as Omit<T, K>;
};

export { omitObjectKey };
