# Interloom

A modern, extensible plugin system for JavaScript/TypeScript projects. Interloom provides a robust framework for plugin discovery, loading, management, and communication, making it easy to build modular and scalable applications.

## Features

- **Plugin Discovery & Loading**: Dynamically discover and load plugins at runtime.
- **Plugin Lifecycle Management**: Hooks for loading, activation, deactivation, and unloading.
- **Plugin Metadata**: Rich metadata support for plugins (name, version, dependencies, tags, etc.).
- **Event-Driven**: Built on top of builtin EventEmitter, but will use [EventEmitter3](https://github.com/primus/eventemitter3) if installed (recommended)
- **Custom Sources**: Register and resolve multiple plugin sources (local, module, etc.).
- **TypeScript Support**: Fully typed API for robust development.
- **Logging**: Pluggable logger interface for custom logging solutions.

## Installation

Install via npm:

```sh
npm install interloom
```

Or with yarn:

```sh
yarn add interloom
```

**Requirements:**

- Node.js >= 16
- TypeScript (recommended for type safety)

**Peer Dependencies:**

- [eventemitter3](https://www.npmjs.com/package/eventemitter3)

If you want to use advanced logging, you may also want to install [pino](https://www.npmjs.com/package/pino) or another compatible logger.

## Usage

```typescript
import { Interloom, BasePlugin } from "interloom";

// Define a plugin (in plugin module/file)
class MyPlugin extends BasePlugin {
  async onLoad() {
    this.context.logger.info("MyPlugin loaded!");
  }
}

// Create an Interloom instance (in consuming application)
const interloom = new Interloom("my-app", { logging: true });

// Load and activate the plugin
interloom.load(new MyPlugin({ name: "my-plugin", version: "1.0.0" }));
interloom.activateAll();
```

## API Overview

All methods, that take in a plugin, can take either the plugin instance or the plugin name (if registered as a source).
Sources are useful for plugins that are not directly imported, but should be discoverable by name (e.g., from a file, module or name).

### Creating a Plugin

Plugins can be creating with two different ways:

1. extend the `BasePlugin` class (recommended):

```typescript
export default class MyPlugin extends BasePlugin {
  constructor() {
    super({
      name: "test",
      version: "1.0.0"
      description: "A test plugin",
    })
  }

  async onLoad() {
    // Initialization logic
  }
  async onActivate() {
    // Code to run when activated
  }
  async onDeactivate() {
    // Cleanup logic
  }
}
```

2. or create an object with the nessary properties:

```typescript
export default myPlugin = {
  metadata: {
    name: "test",
    version: "1.0.0"
    description: "A test plugin",
  },
  async onLoad() {
    // Initialization logic
  }
  async onActivate() {
    // Code to run when activated
  }
  async onDeactivate() {
    // Cleanup logic
  }
}
```

Both can implement lifecycle hooks as needed, but BasePlugin gives access to more powerful features!!

### Loading Plugins

You can load plugins by instance or by name (if registered as a source):

```typescript
const plugin = new MyPlugin({ name: "my-plugin", version: "1.0.0" });
interloom.load(plugin);
// Or load multiple:
interloom.loadAll([plugin1, plugin2]);
```

### Activating & Deactivating Plugins

```typescript
await interloom.activate("my-plugin");
await interloom.deactivate("my-plugin");
```

### Registering Plugin Sources

Register a custom plugin source (e.g., from a file, module or url):

```typescript
interloom.register("custom-plugin", "./plugins/custom-plugin.js", "file");
```

### Listening to Events

Interloom extends EventEmitter3, so you can listen to events:

```typescript
interloom.on("plugin:loaded", (plugin) => {
  console.log("Plugin loaded:", plugin);
});
```

## Contributing

We welcome contributions of all kinds! To get started:

1. **Fork** the repository and create your branch from `main`.
2. **Install dependencies** with `npm install` or `yarn install`.
3. **Write clear, well-documented code** and add tests if possible.
4. **Open a pull request** describing your changes.

For major changes, please open an issue first to discuss what you would like to change.

You can also help by reporting bugs or suggesting features via [GitHub Issues](https://github.com/Bruderjulian/interloom/issues).

## License

MIT

## Author

[BruderJulian](https://github.com/Bruderjulian)
