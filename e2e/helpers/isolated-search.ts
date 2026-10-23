import { test as base, expect } from "@playwright/test";

export const test = base.extend<{ isolation: void }>({
  isolation: [async ({ context }, use) => {
    const mutations: string[] = [];
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin !== "http://127.0.0.1:3109") return route.abort("blockedbyclient");
      if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
        mutations.push(request.method());
        return route.abort("blockedbyclient");
      }
      return route.fallback();
    });
    await context.routeWebSocket(/.*/, (socket) => socket.close());
    await use();
    expect(mutations, "Aucune mutation réseau autorisée dans la recette avec fixtures").toEqual([]);
  }, { auto: true }],
});
export { expect };
