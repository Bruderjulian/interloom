import type { EventEmitter } from "eventemitter3";

export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
  softDependencies?: string[];
  tags?: string[];
  priority?: number;
}
export interface FullPluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
  softDependencies?: string[];
  tags?: string[];
  priority: number;
}
export type Plugin = {
  metadata: PluginMetadata;

  onLoad?: () => Promise<void>;
  onActivate?: () => Promise<void>;
  onDeactivate?: () => Promise<void>;
  onUnload?: () => Promise<void>;
  onConfigChange?: (config: PluginConfig) => Promise<void>;
  onDependencyChange?: (dependency: string) => Promise<void>;
};

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export type PluginConfig = {
  [key: string]: any;
};

export interface EventEmitter2 {
  on(event: string, listener: (...args: any[]) => void): this;
  off(event: string, listener: (...args: any[]) => void): this;
  emit(event: string, ...args: any[]): boolean;
  once(event: string, listener: (...args: any[]) => void): this;
  removeAllListeners(event?: string): this;
}

export interface PluginContext {
  logger: Logger;
  config: PluginConfig;
  eventBus: EventEmitter;
  loadedAt: number;
}

// Plugin search query
export interface PluginSearchQuery {
  name?: string;
  tags?: string[];
  author?: string;
  description?: string;
}

export type InterloomOptions = {
  namespace?: string;
  autoDiscover?: boolean;
  autoDownload?: boolean;
  logging?: boolean;
  logger?: Logger;

  blacklist?: string[];
  whitelist?: string[];
};
export type FullInterloomOptions = Required<InterloomOptions>;

export interface PluginDescriptor {
  name: string;
  path: string;
  metadata: PluginMetadata;
  entryPoint: string;
}
