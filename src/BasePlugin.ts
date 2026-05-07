import {
  type PluginContext,
  type PluginConfig,
  type Plugin,
  type FullPluginMetadata,
  type PluginMetadata,
} from "./types.ts";
import {
  isObject,
  isDefined,
  isArray,
  isNumber,
  ValidationError,
  LoadingError,
} from "./utils.ts";

export abstract class BasePlugin implements Plugin {
  public context!: PluginContext;
  #name: string;
  #metadata: FullPluginMetadata;
  #isLoaded: boolean = false;
  #isActivated: boolean = false;

  constructor(metadata: PluginMetadata) {
    metadata = metadata || {};
    if (!isObject(metadata)) {
      throw new ValidationError("Invalid Options");
    }
    metadata.priority = isDefined(metadata.priority) ? metadata.priority : 0;
    this.#metadata = metadata as FullPluginMetadata;

    if (typeof metadata.name !== "string" || metadata.name.length == 0) {
      throw new ValidationError("Invalid Name for Plugin");
    }
    this.#name = metadata.name;
    if (
      isDefined(metadata.version) &&
      (typeof metadata.version !== "string" || metadata.version.length == 0)
    ) {
      throw new ValidationError(
        "Invalid Version '" + metadata.version + "'for Plugin " + this.#name,
      );
    }
    if (
      isDefined(metadata.description) &&
      (typeof metadata.description !== "string" ||
        metadata.description.length == 0)
    ) {
      throw new ValidationError(
        "Invalid Description '" +
          metadata.description +
          "'for Plugin " +
          this.#name,
      );
    }
    if (
      isDefined(metadata.author) &&
      (typeof metadata.author !== "string" || metadata.author.length == 0)
    ) {
      throw new ValidationError(
        "Invalid Author '" + metadata.author + "'for Plugin " + this.#name,
      );
    }
    if (!isNumber(metadata.priority)) {
      throw new ValidationError(
        "Invalid Priority '" + metadata.priority + "'for Plugin " + this.#name,
      );
    }
    if (isDefined(metadata.tags)) {
      if (typeof metadata.tags == "string") {
        metadata.tags = [metadata.tags];
      }
      if (!isArray(metadata.tags)) {
        throw new ValidationError("Invalid Tags for Plugin " + metadata.name);
      }
      if (metadata.tags.some((v) => typeof v !== "string" || v.length === 0)) {
        throw new ValidationError(
          "Invalid Tags '" + metadata.tags + "'for Plugin " + this.#name,
        );
      }
    }
    if (isDefined(metadata.dependencies)) {
      if (typeof metadata.dependencies == "string") {
        metadata.dependencies = [metadata.dependencies];
      }
      if (!isArray(metadata.dependencies)) {
        throw new ValidationError(
          "Invalid Dependencies for Plugin " + metadata.name,
        );
      }
      if (
        metadata.dependencies.some(
          (v) => typeof v !== "string" || v.length === 0,
        )
      ) {
        throw new ValidationError(
          "Invalid Dependencie '" +
            metadata.dependencies +
            "'for Plugin " +
            this.#name,
        );
      }
    }
    if (isDefined(metadata.softDependencies)) {
      if (typeof metadata.softDependencies == "string") {
        metadata.softDependencies = [metadata.softDependencies];
      }
      if (!isArray(metadata.softDependencies)) {
        throw new ValidationError(
          "Invalid Dependencies for Plugin " + metadata.name,
        );
      }
      if (
        metadata.softDependencies.some(
          (v) => typeof v !== "string" || v.length === 0,
        )
      ) {
        throw new ValidationError(
          "Invalid Dependencie '" +
            metadata.softDependencies +
            "'for Plugin " +
            this.#name,
        );
      }
    }
  }

  get metadata(): FullPluginMetadata {
    return this.#metadata;
  }
  get isLoaded(): boolean {
    return this.#isLoaded;
  }
  get isActivated(): boolean {
    return this.#isActivated;
  }

  async load(context: PluginContext): Promise<void> {
    if (this.#isLoaded) {
      return;
    }
    if (!isObject(context)) {
      throw new LoadingError("Invalid Plugin Context");
    }
    this.context = context;
    try {
      if (this.onLoad) {
        await this.onLoad();
      }
      this.#isLoaded = true;
      this.context.eventBus.emit("plugin:loaded", {
        name: this.#name,
        plugin: this,
      });
      this.context.logger.info(`Plugin ${this.#name} loaded successfully`);
    } catch (err) {
      this.context.logger.error(`Failed to loaded plugin ${this.#name}:`, err);
    }
  }

  async activate(): Promise<void> {
    if (this.#isActivated) {
      return;
    }
    try {
      if (this.onActivate) {
        await this.onActivate();
      }
      this.#isActivated = true;
      this.context.eventBus.emit("plugin:activated", {
        name: this.#name,
        plugin: this,
      });
      this.context.logger.info(`Plugin ${this.#name} activated successfully`);
    } catch (err) {
      this.context.logger.error(
        `Failed to activated plugin ${this.#name}:`,
        err,
      );
    }
  }

  async deactivate(): Promise<void> {
    if (!this.#isActivated) {
      return;
    }
    try {
      if (this.onDeactivate) {
        await this.onDeactivate();
      }
      this.#isActivated = false;
      this.context.eventBus.emit("plugin:deactivated", {
        name: this.#name,
        plugin: this,
      });
      this.context.logger.info(`Plugin ${this.#name} deactivated successfully`);
    } catch (err) {
      this.context.logger.error(
        `Failed to deactivated plugin ${this.#name}:`,
        err,
      );
    }
  }

  async unload(): Promise<void> {
    if (!this.#isLoaded) {
      return;
    }
    try {
      if (this.onUnload) {
        await this.onUnload();
      }
      this.#isLoaded = false;
      this.context.eventBus.emit("plugin:unloaded", {
        name: this.#name,
        plugin: this,
      });
      this.context.logger.info(`Plugin ${this.#name} unloaded successfully`);
    } catch (err) {
      this.context.logger.error(
        `Failed to unloaded plugin ${this.#name}:`,
        err,
      );
    }
  }

  // Abstract methods that subclasses must implement
  public async onLoad(): Promise<void> {}
  public async onActivate(): Promise<void> {}
  public async onDeactivate(): Promise<void> {}
  public async onUnload(): Promise<void> {}
  public async onConfigChange(config: PluginConfig): Promise<void> {}
  public async onDependencyChange(dependency: string): Promise<void> {}

  // Utility methods
  protected getConfig<T = any>(key?: string): T {
    if (key) {
      return this.context.config[key];
    }
    return this.context.config as T;
  }

  protected emit(event: string, data?: any): void {
    this.context.eventBus.emit(`plugin:${this.metadata.name}:${event}`, data);
  }

  protected on(event: string, listener: (...args: any[]) => void): void {
    this.context.eventBus.on(event, listener);
  }

  protected off(event: string, listener: (...args: any[]) => void): void {
    this.context.eventBus.off(event, listener);
  }
}
