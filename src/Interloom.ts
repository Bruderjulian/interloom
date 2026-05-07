import { EventEmitter } from "eventemitter3";
import { BasePlugin } from "./BasePlugin.js";
import { SourceRegistry } from "./registry.ts";
import type {
  FullInterloomOptions,
  InterloomOptions,
  Logger,
  PluginConfig,
  PluginSource,
  PluginSourceType,
} from "./types.js";
import {
  emptyLogger,
  isArray,
  isDefined,
  isObject,
  ValidationError,
} from "./utils.js";
import { PluginManager } from "./manager.ts";

const defaultOptions: FullInterloomOptions = {
  namespace: "",
  autoDiscover: true,
  autoDownload: true,
  logging: false,
  logger: emptyLogger,
  blacklist: [],
  whitelist: [],
};

export class Interloom extends EventEmitter {
  private options: FullInterloomOptions;
  private namespace: string;
  private logger: Logger;
  private manager: PluginManager;
  private sourceRegistry: SourceRegistry;

  constructor(namespace: InterloomOptions | string, options: InterloomOptions) {
    super();
    options = options || {};
    if (!isObject(options)) {
      throw new ValidationError("Options must be an object");
    }
    if (isObject(namespace)) {
      this.options = Object.assign(options, namespace, defaultOptions);
    } else if (typeof namespace === "string") {
      this.options = Object.assign(options, defaultOptions);
      this.options.namespace = namespace;
    } else {
      throw new ValidationError("Invalid Namespace Type");
    }
    this.namespace = this.options.namespace;
    this.logger = this.options.logger || emptyLogger;
    if (typeof this.namespace !== "string" || this.namespace.length == 0) {
      throw new ValidationError("Namespace must not be empty");
    }
    if (!isDefined(this.logger)) {
      throw new ValidationError("Logger must be defined");
    }
    this.manager = new PluginManager(this.logger, this);
    this.sourceRegistry = new SourceRegistry(this.logger, this);
  }

  async load(plugin: string | BasePlugin, config?: PluginConfig) {
    this.manager.load(plugin);
  }

  async loadAll(plugins?: string[] | BasePlugin[]) {
    if (!plugins) {
      await this.manager.loadAll();
      return;
    }
    if (!isArray(plugins)) {
      throw new TypeError("Plugins must be an array");
    }
    for (const plugin of plugins) {
      await this.manager.load(plugin);
    }
  }

  async activate(plugin: string | BasePlugin) {
    await this.manager.activate(plugin);
  }

  async activateAll(plugins?: string[] | BasePlugin[]) {
    if (!plugins) {
      await this.manager.activateAll();
      return;
    }
    if (!isArray(plugins)) {
      throw new TypeError("Plugins must be an array");
    }
    for (const plugin of plugins) {
      await this.manager.activate(plugin);
    }
  }

  async deactivate(plugin: string | BasePlugin) {
    await this.manager.deactivate(plugin);
  }

  async deactivateAll(plugins?: string[] | BasePlugin[]) {
    if (!plugins) {
      await this.manager.deactivateAll();
      return;
    }
    if (!isArray(plugins)) {
      throw new TypeError("Plugins must be an array");
    }
    for (const plugin of plugins) {
      await this.manager.deactivate(plugin);
    }
  }

  async unload(plugin: string | BasePlugin) {
    await this.manager.unload(plugin);
  }

  async unloadAll(plugins?: string[] | BasePlugin[]) {
    if (!plugins) {
      await this.manager.unloadAll();
      return;
    }
    if (!isArray(plugins)) {
      throw new TypeError("Plugins must be an array");
    }
    for (const plugin of plugins) {
      await this.manager.unload(plugin);
    }
  }

  registerSource(name: string, path: string, type: PluginSourceType) {
    this.sourceRegistry.register(name, path, type);
  }

  unregisterSource(name: string): boolean {
    return this.sourceRegistry.unregister(name);
  }

  listSources(): PluginSource[] {
    return this.sourceRegistry.list();
  }

  setNamespace(name: string) {
    if (typeof name !== "string" || name.length == 0) {
      throw new TypeError("Namespace must not be empty");
    }
    this.namespace = name;
  }

  getNamespace() {
    return this.namespace;
  }

  setAutoDiscover(value: boolean) {
    if (typeof value !== "boolean") {
      throw new TypeError("AutoDiscover must be a boolean");
    }
    this.options.autoDiscover = value;
  }

  hasAutoDiscover() {
    return this.options.autoDiscover;
  }

  setAutoDownload(value: boolean) {
    if (typeof value !== "boolean") {
      throw new TypeError("AutoDownload must be a boolean");
    }
    this.options.autoDownload = value;
  }

  hasAutoDownload() {
    return this.options.autoDownload;
  }

  setLogging(value: boolean) {
    if (typeof value !== "boolean") {
      throw new TypeError("Logging must be a boolean");
    }
    this.options.logging = value;
  }

  hasLogging() {
    return this.options.logging;
  }

  setLogger(logger: Logger) {
    if (typeof logger !== "boolean") {
      throw new TypeError("Logger must not be empty");
    }
    this.options.logger = logger;
  }

  getLogger() {
    return this.options.logging;
  }

  setBlacklist(blacklist: string[]) {
    if (
      !Array.isArray(blacklist) ||
      !blacklist.every((item) => typeof item === "string")
    ) {
      throw new TypeError("Blacklist must be an array of strings");
    }
    this.options.blacklist = blacklist;
  }

  getBlacklist() {
    return this.options.blacklist;
  }

  setWhitelist(whitelist: string[]) {
    if (
      !Array.isArray(whitelist) ||
      !whitelist.every((item) => typeof item === "string")
    ) {
      throw new TypeError("Whitelist must be an array of strings");
    }
    this.options.whitelist = whitelist;
  }

  getWhitelist() {
    return this.options.whitelist;
  }
}
