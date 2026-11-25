import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "../src/proxy";

const request = (authorization?: string) =>
  new NextRequest("http://localhost/applications", { headers: authorization ? { authorization } : {} });
const basic = (user: string, password: string) => `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
const passes = (res: Response) => res.headers.get("x-middleware-next") === "1";

describe("basic auth proxy", () => {
  afterEach(() => {
    delete process.env.BASIC_AUTH_USER;
    delete process.env.BASIC_AUTH_PASSWORD;
  });

  it("is disabled when no password is configured", () => {
    assert.ok(passes(proxy(request())));
  });

  it("challenges requests without valid credentials", () => {
    process.env.BASIC_AUTH_PASSWORD = "s3cret";
    for (const header of [undefined, basic("admin", "wrong"), basic("root", "s3cret"), "Bearer s3cret", "Basic !!!"]) {
      const res = proxy(request(header));
      assert.equal(res.status, 401, `expected 401 for ${header}`);
      assert.match(res.headers.get("www-authenticate") ?? "", /^Basic realm="HorizonEA"/);
    }
  });

  it("accepts the configured user (default admin) and password", () => {
    process.env.BASIC_AUTH_PASSWORD = "pa:ss";
    assert.ok(passes(proxy(request(basic("admin", "pa:ss")))));
    process.env.BASIC_AUTH_USER = "ea-team";
    assert.ok(passes(proxy(request(basic("ea-team", "pa:ss")))));
    assert.equal(proxy(request(basic("admin", "pa:ss"))).status, 401);
  });
});
