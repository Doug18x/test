// Shim for the window.storage.get/set API the app expects, backed by
// localStorage so the app persists data when running as a standalone build.
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    async get(key) {
      const value = window.localStorage.getItem(key);
      return value === null ? null : { value };
    },
    async set(key, value) {
      window.localStorage.setItem(key, value);
    },
  };
}
