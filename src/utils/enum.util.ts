// src/utils/enum.util.ts

export const isEnumValue = <T extends Record<string, string>>(
  enumObj: T,
  value: unknown
): value is T[keyof T] => {
  return typeof value === "string" && Object.values(enumObj).includes(value);
};
