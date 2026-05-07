import type { EventEmitter } from "eventemitter3";
import {
  type Logger,
  type PluginConfig,
  type PluginContext,
  type PluginSearchQuery,
} from "./types.ts";
import { BasePlugin } from "./BasePlugin.ts";
import { isArray, isObject, LoadingError } from "./utils.ts";
import { SourceRegistry } from "./registry.ts";

export class PluginManager {
  private plugins: Map<string, BasePlugin>;
  private tags = new Map<string, Set<string>>();
  private sourceRegistry: SourceRegistry;

  #logger;
  #emitter;
  constructor(logger: Logger, emitter: EventEmitter) {
    this.#logger = logger;
    this.#emitter = emitter;
    this.plugins = new Map<string, BasePlugin>();
    this.tags = new Map<string, Set<string>>();
    this.sourceRegistry = new SourceRegistry(logger, emitter);
  }

  async load(plugin: BasePlugin | string, config?: PluginConfig) {
    plugin = this.#resolve(plugin, config);

    const { name } = plugin.metadata;
    if (this.plugins.has(name) || plugin.isLoaded) {
      return;
    }
    this.#logger.info(`Loading plugin: ${name}`);
    this.plugins.set(name, plugin);

    // Categorize by tags
    if (isArray(plugin.metadata.tags)) {
      for (const tag of plugin.metadata.tags) {
        if (!this.tags.has(tag)) {
          this.tags.set(tag, new Set());
        }
        this.tags.get(tag)!.add(name);
      }
    }

    await this.#handleDependencies(plugin.metadata.dependencies, true, true);
    await this.#handleDependencies(
      plugin.metadata.softDependencies,
      true,
      true,
    );
    await plugin.load(this.#createPluginContext(plugin, name));
  }

  // Activate plugin
  async activate(name: string | BasePlugin): Promise<void> {
    const plugin = this.#resolveName(name);
    if (!plugin.isLoaded) {
      await this.load(plugin, {});
    }
    await this.#handleDependencies(plugin.metadata.dependencies, true, false);
    await this.#handleDependencies(
      plugin.metadata.softDependencies,
      true,
      false,
    );
    await plugin.activate();
  }

  // Deactivate plugin
  async deactivate(name: string | BasePlugin): Promise<void> {
    const plugin = this.#resolveName(name);
    await this.#handleDependencies(plugin.metadata.dependencies, false, false);
    await this.#handleDependencies(
      plugin.metadata.softDependencies,
      false,
      false,
    );
    await plugin.deactivate();
  }

  // Unload plugin
  async unload(name: string | BasePlugin): Promise<void> {
    const plugin = this.#resolveName(name);

    // Check if other plugins depend on this plugin
    const dependents = this.#getDependents(plugin.metadata.name);
    if (dependents.length > 0) {
      throw new LoadingError(
        `Cannot unload plugin ${plugin.metadata.name}: it has dependents: ${dependents.join(", ")}`,
      );
    }

    if (plugin.isActivated) {
      await this.deactivate(plugin);
    }
    await this.#handleDependencies(plugin.metadata.dependencies, false, true);
    await this.#handleDependencies(
      plugin.metadata.softDependencies,
      false,
      true,
    );
    await plugin.unload();
  }

  // Batch operations
  async loadAll(): Promise<void> {
    const sortedPlugins = this.#topologicalSort();
    for (const name of sortedPlugins) {
      await this.load(name);
    }
  }

  async activateAll(): Promise<void> {
    const sortedPlugins = this.#topologicalSort();
    for (const name of sortedPlugins) {
      await this.activate(name);
    }
  }

  async deactivateAll(): Promise<void> {
    const sortedPlugins = this.#topologicalSort().reverse();
    for (const name of sortedPlugins) {
      if (this.plugins.get(name)?.isActivated) {
        await this.deactivate(name);
      }
    }
  }

  async unloadAll(): Promise<void> {
    const sortedPlugins = this.#topologicalSort().reverse();
    for (const name of sortedPlugins) {
      if (this.plugins.get(name)?.isLoaded) {
        await this.unload(name);
      }
    }
  }

  // Configuration management
  async updatePluginConfig(name: string, config: PluginConfig): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new LoadingError(`Plugin ${name} not found`);
    }
    config = Object.assign(plugin.context.config, config);

    if (plugin.onConfigChange) {
      await plugin.onConfigChange(config);
    }
    this.#emitter.emit("plugin:config-changed", { name, config });
  }

  // Get plugin information
  getPlugin(name: string): BasePlugin | undefined {
    return this.plugins.get(name);
  }

  getPluginConfig(name: string): PluginConfig {
    const plugin = this.plugins.get(name);
    return !plugin ? {} : plugin.context.config;
  }

  getAllPlugins(): Map<string, BasePlugin> {
    return new Map(this.plugins);
  }

  getActivePlugins(): BasePlugin[] {
    return Array.from(this.plugins.values()).filter(
      (plugin) => plugin.isActivated,
    );
  }

  // Find by tag
  getByTag(tag: string): BasePlugin[] {
    const pluginNames = this.tags.get(tag) || new Set();
    return Array.from(pluginNames)
      .map((name) => this.plugins.get(name))
      .filter(Boolean) as BasePlugin[];
  }

  // Sort by priority
  getByPriority(): BasePlugin[] {
    return Array.from(this.plugins.values()).sort(
      (a, b) => b.metadata.priority - a.metadata.priority,
    );
  }

  // Search plugins
  search(query: PluginSearchQuery): BasePlugin[] {
    const results: BasePlugin[] = [];

    for (const [name, plugin] of this.plugins.entries()) {
      const { metadata } = plugin;

      let matches = true;

      // Name matching
      if (
        query.name &&
        !name.toLowerCase().includes(query.name.toLowerCase())
      ) {
        matches = false;
      }

      // Tag matching
      if (query.tags && query.tags.length > 0) {
        const pluginTags = metadata.tags || [];
        const hasMatchingTag = query.tags.some((tag) =>
          pluginTags.some((pTag) =>
            pTag.toLowerCase().includes(tag.toLowerCase()),
          ),
        );
        if (!hasMatchingTag) {
          matches = false;
        }
      }

      // Author matching
      if (
        query.author &&
        metadata.author &&
        !metadata.author.toLowerCase().includes(query.author.toLowerCase())
      ) {
        matches = false;
      }

      // Description matching
      if (
        query.description &&
        metadata.description &&
        !metadata.description
          .toLowerCase()
          .includes(query.description.toLowerCase())
      ) {
        matches = false;
      }

      if (matches) {
        results.push(plugin);
      }
    }

    return results;
  }

  #resolve(plugin: BasePlugin | string, config?: PluginConfig): BasePlugin {
    if (typeof plugin === "string") {
      if (this.plugins.has(plugin)) {
        plugin = this.plugins.get(plugin) as BasePlugin;
      } else {
        let cls = this.sourceRegistry.resolve(plugin);
        plugin = new cls(config);
      }
    }
    if (!plugin || !(plugin instanceof BasePlugin)) {
      throw new TypeError("Plugin must be an instance of BasePlugin");
    }

    if (config) {
      if (!isObject(config)) {
        throw new TypeError("Config must be an object");
      }
      plugin.onConfigChange(config);
    }
    return plugin;
  }

  #resolveName(plugin: BasePlugin | string): BasePlugin {
    if (typeof plugin === "string") {
      plugin = this.plugins.get(plugin) as BasePlugin;
    }
    if (!plugin || !(plugin instanceof BasePlugin)) {
      throw new TypeError("Plugin must be an instance of BasePlugin");
    }
    return plugin;
  }

  #createPluginContext(plugin: BasePlugin, pluginName: string): PluginContext {
    return {
      logger: this.#createPluginLogger(pluginName),
      config: plugin,
      eventBus: this.#emitter,
      loadedAt: Date.now(),
    };
  }
  #createPluginLogger(pluginName: string): Logger {
    return {
      debug: (message: string, ...args: any[]) =>
        this.#logger.debug(`[${pluginName}] ${message}`, ...args),
      info: (message: string, ...args: any[]) =>
        this.#logger.info(`[${pluginName}] ${message}`, ...args),
      warn: (message: string, ...args: any[]) =>
        this.#logger.warn(`[${pluginName}] ${message}`, ...args),
      error: (message: string, ...args: any[]) =>
        this.#logger.error(`[${pluginName}] ${message}`, ...args),
    };
  }

  async #handleDependencies(
    deps: string[] | undefined,
    direction: boolean,
    shouldLoad: boolean,
  ): Promise<void> {
    if (!deps || deps.length === 0) return;
    for (const dep of deps) {
      const depPlugin = this.#resolve(dep);
      if (shouldLoad && direction && !depPlugin.isLoaded) {
        await this.load(dep);
      } else if (shouldLoad && !direction && depPlugin.isLoaded) {
        await this.unload(dep);
      } else if (!shouldLoad && direction && !depPlugin.isActivated) {
        await this.activate(dep);
      } else if (!shouldLoad && !direction && depPlugin.isActivated) {
        await this.deactivate(dep);
      }
    }
  }

  #getDependents(pluginName: string): string[] {
    const dependents: string[] = [];

    for (const [name, plugin] of this.plugins.entries()) {
      const dependencies = plugin.metadata.dependencies || [];
      if (dependencies && dependencies.includes(pluginName)) {
        dependents.push(name);
      }
    }

    return dependents;
  }

  #topologicalSort(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: string[] = [];

    const visit = (name: string): void => {
      if (visiting.has(name)) {
        throw new LoadingError(
          `Circular dependency detected involving ${name}`,
        );
      }

      if (visited.has(name)) {
        return;
      }
      visiting.add(name);

      const plugin = this.plugins.get(name);
      if (plugin && plugin.metadata.dependencies) {
        for (const dep of plugin.metadata.dependencies) {
          visit(dep);
        }
      }

      visiting.delete(name);
      visited.add(name);
      result.push(name);
    };

    for (const name of this.plugins.keys()) {
      if (!visited.has(name)) {
        visit(name);
      }
    }

    return result;
  }
}
