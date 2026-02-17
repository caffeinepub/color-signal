export type BigSmallResult = 'Big' | 'Small';

export function isBigSmallResult(value: string): value is BigSmallResult {
  return value === 'Big' || value === 'Small';
}

export function normalizeBigSmallResult(value: string): BigSmallResult {
  const normalized = value.trim();
  if (isBigSmallResult(normalized)) {
    return normalized;
  }
  throw new Error(`Invalid result: ${value}. Must be 'Big' or 'Small'.`);
}
