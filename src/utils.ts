import { BaseError } from "make-error";
import type { Logger } from "./types.ts";
import { stat } from "fs/promises";

export const isArray =
  Array.isArray ||
  function (a: any): a is any[] {
    return a && a.constructor === Array;
  };

export function isObject(obj: any): obj is Record<string, any> {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj);
}

export function isFunction(v: any): v is Function {
  return typeof v === "function";
}

export function isNumber(n: any): n is number {
  return typeof n === "number" && !isNaN(n);
}

export function isDefined<T>(v?: T): v is NonNullable<T> {
  return typeof v !== "undefined" && v !== null;
}

export const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn =
  Object.hasOwn ||
  function (obj: Record<string, any>, prop: string): boolean {
    return hasOwnProperty.call(obj, prop);
  };

export async function isFile(path: string) {
  try {
    return (await stat(path)).isFile();
  } catch (err) {
    return false;
  }
}

export async function isDirectory(path: string) {
  try {
    return (await stat(path)).isFile();
  } catch (err) {
    return false;
  }
}

export function deepEqual(x: any, y: any): boolean {
  if (x === y) {
    return true;
  } else if (
    typeof x == "object" &&
    x != null &&
    typeof y == "object" &&
    y != null
  ) {
    if (Object.keys(x).length != Object.keys(y).length) {
      return false;
    }

    for (let prop in x) {
      if (hasOwn(y, prop)) {
        if (!deepEqual(x[prop], y[prop])) {
          return false;
        }
      } else {
        return false;
      }
    }

    return true;
  } else {
    return false;
  }
}

export const emptyLogger: Logger = {
  debug: function (message: string, ...args: any[]): void {},
  info: function (message: string, ...args: any[]): void {},
  warn: function (message: string, ...args: any[]): void {},
  error: function (message: string, ...args: any[]): void {},
} as const;

export class ValidationError extends BaseError {
  constructor(message: string) {
    super(message);
  }
}

export class LoadingError extends BaseError {
  constructor(message: string) {
    super(message);
  }
}
