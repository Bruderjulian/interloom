import { strictEqual } from "assert";
import { describe, beforeEach, it } from "node:test";
import { Interloom, BasePlugin } from "../src/index.ts";

describe("Interloom Basic Plugin Management", () => {
  class DummyPlugin extends BasePlugin {
    constructor() {
      super({ name: "dummy", version: "1.0.0" });
    }
  }

  let interloom: Interloom;
  let plugin: DummyPlugin;

  beforeEach(() => {
    interloom = new Interloom("test", {});
    plugin = new DummyPlugin();
  });

  it("loads a plugin", async () => {
    await interloom.load(plugin);
    strictEqual(plugin.isLoaded, true);
  });

  it("activates a plugin", async () => {
    await interloom.load(plugin);
    await interloom.activate(plugin);
    strictEqual(plugin.isActivated, true);
  });

  it("deactivates a plugin", async () => {
    await interloom.load(plugin);
    await interloom.activate(plugin);
    await interloom.deactivate(plugin);
    strictEqual(plugin.isActivated, false);
  });
});
