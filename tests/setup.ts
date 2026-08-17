import { vi } from "vitest";

// Vitest stubs para dependencias "server-only".
vi.mock("server-only", () => ({}));
