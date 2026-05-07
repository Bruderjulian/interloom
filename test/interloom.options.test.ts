import { deepStrictEqual, strictEqual } from "assert";
import { describe, it } from "node:test";
import { Interloom } from "../src/index.ts";

describe("Interloom Options", () => {
  it("sets and gets namespace", () => {
    const interloom = new Interloom("ns", {});
    interloom.setNamespace("newns");
    strictEqual(interloom.getNamespace(), "newns");
  });

  it("sets and gets autoDiscover", () => {
    const interloom = new Interloom("ns", {});
    interloom.setAutoDiscover(true);
    strictEqual(interloom.hasAutoDiscover(), true);
  });

  it("sets and gets autoDownload", () => {
    const interloom = new Interloom("ns", {});
    interloom.setAutoDownload(true);
    strictEqual(interloom.hasAutoDownload(), true);
  });

  it("sets and gets logging", () => {
    const interloom = new Interloom("ns", {});
    interloom.setLogging(true);
    strictEqual(interloom.hasLogging(), true);
  });

  it("sets and gets blacklist/whitelist", () => {
    const interloom = new Interloom("ns", {});
    interloom.setBlacklist(["a", "b"]);
    deepStrictEqual(interloom.getBlacklist(), ["a", "b"]);
    interloom.setWhitelist(["x"]);
    deepStrictEqual(interloom.getWhitelist(), ["x"]);
  });
});
