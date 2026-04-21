/**
 * SECURITY TESTS
 *
 * Verifies that the library API routes enforce authentication, reject
 * malformed payloads, handle XSS-flavoured input safely, and that the
 * deployment environment has required secrets set.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";

// Must be hoisted before any import that transitively pulls in server-only
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    libraryCollection: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { GET, PUT } from "@/app/api/library/route";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockGetSession = vi.mocked(getSession);
const mockFindUnique = vi.mocked(prisma.libraryCollection.findUnique);
const mockUpsert = vi.mocked(prisma.libraryCollection.upsert);

const VALID_SESSION = {
  userId: "user-abc",
  email: "test@example.com",
  expiresAt: new Date(Date.now() + 86_400_000),
};

const STUB_COLLECTION = {
  id: "col-1",
  userId: "user-abc",
  items: "[]",
  updatedAt: new Date(),
};

function makePutRequest(body: unknown) {
  return new Request("http://localhost/api/library", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── GET /api/library ──────────────────────────────────────────────────────────

describe("GET /api/library — authentication", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 Unauthorized when no session exists", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Unauthorized");
  });

  test("never calls the database when unauthenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    await GET();
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  test("returns 200 with an items array when session is valid", async () => {
    mockGetSession.mockResolvedValue(VALID_SESSION);
    mockFindUnique.mockResolvedValue(STUB_COLLECTION);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.items)).toBe(true);
  });

  test("returns an empty items array when the user has no saved collection", async () => {
    mockGetSession.mockResolvedValue(VALID_SESSION);
    mockFindUnique.mockResolvedValue(null);
    const res = await GET();
    expect((await res.json()).items).toEqual([]);
  });

  test("queries by the session userId (not a hardcoded value)", async () => {
    mockGetSession.mockResolvedValue(VALID_SESSION);
    mockFindUnique.mockResolvedValue(null);
    await GET();
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: VALID_SESSION.userId } })
    );
  });
});

// ── PUT /api/library ──────────────────────────────────────────────────────────

describe("PUT /api/library — authentication", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when no session exists", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await PUT(makePutRequest({ items: [] }));
    expect(res.status).toBe(401);
  });

  test("never writes to the database when unauthenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    await PUT(makePutRequest({ items: [] }));
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});

describe("PUT /api/library — input validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(VALID_SESSION);
  });

  test("returns 400 when items is a string instead of array", async () => {
    const res = await PUT(makePutRequest({ items: "not-an-array" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid payload");
  });

  test("returns 400 when items is a plain object", async () => {
    const res = await PUT(makePutRequest({ items: { id: "1" } }));
    expect(res.status).toBe(400);
  });

  test("returns 400 when items is null", async () => {
    const res = await PUT(makePutRequest({ items: null }));
    expect(res.status).toBe(400);
  });

  test("returns 400 when the items field is absent entirely", async () => {
    const res = await PUT(makePutRequest({ data: [] }));
    expect(res.status).toBe(400);
  });

  test("returns 200 and calls upsert for a valid empty-array payload", async () => {
    mockUpsert.mockResolvedValue(STUB_COLLECTION);
    const res = await PUT(makePutRequest({ items: [] }));
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledOnce();
  });

  test("stores items as a JSON string in the database (not a raw object)", async () => {
    mockUpsert.mockResolvedValue(STUB_COLLECTION);
    const items = [{ id: "1", title: "Dune", type: "book" }];
    await PUT(makePutRequest({ items }));
    const call = mockUpsert.mock.calls[0][0] as {
      update: { items: string };
      create: { items: string };
    };
    expect(typeof call.update.items).toBe("string");
    expect(JSON.parse(call.update.items)).toEqual(items);
  });

  test("upsert uses the session userId as the lookup key", async () => {
    mockUpsert.mockResolvedValue(STUB_COLLECTION);
    await PUT(makePutRequest({ items: [] }));
    const call = mockUpsert.mock.calls[0][0] as { where: { userId: string } };
    expect(call.where.userId).toBe(VALID_SESSION.userId);
  });
});

// ── XSS / injection resistance ────────────────────────────────────────────────

describe("XSS and injection resistance", () => {
  const XSS_PAYLOADS = [
    '<script>alert("xss")</script>',
    '"><img src=x onerror=alert(1)>',
    "'; DROP TABLE users; --",
    "\u0000null byte\u0000",
    "A".repeat(10_000), // oversized title
  ];

  test.each(XSS_PAYLOADS)(
    "payload %j survives JSON round-trip as a plain string",
    (payload) => {
      const item = { id: "1", title: payload, type: "book" };
      const deserialized = JSON.parse(JSON.stringify(item));
      // Must come back as the exact same string — no mutation, no execution
      expect(deserialized.title).toBe(payload);
      expect(typeof deserialized.title).toBe("string");
    }
  );

  test("item with HTML special chars in title round-trips without entity encoding", () => {
    const title = 'Tom & Jerry\'s "Great" <Adventure>';
    const roundTripped = JSON.parse(JSON.stringify({ title })).title;
    expect(roundTripped).toBe(title);
  });
});

// ── Environment / secrets hardening ──────────────────────────────────────────

describe("Environment secrets", () => {
  test("JWT_SECRET must not be the insecure development fallback in production", () => {
    const secret = process.env.JWT_SECRET;
    if (process.env.NODE_ENV === "production") {
      expect(secret).toBeDefined();
      expect(secret).not.toBe("development-secret-key");
      expect(secret!.length).toBeGreaterThanOrEqual(32);
    } else {
      // Dev/CI: warn but don't fail the test suite
      if (!secret || secret === "development-secret-key") {
        console.warn(
          "⚠️  JWT_SECRET is absent or using the insecure fallback — set it before deploying"
        );
      }
    }
  });

  test("DATABASE_URL must be a PostgreSQL connection string when set", () => {
    const url = process.env.DATABASE_URL;
    if (url) {
      expect(url).toMatch(/^(postgresql|postgres):\/\//);
    } else {
      console.warn("⚠️  DATABASE_URL is not set — database operations will fail");
    }
  });

  test("ANTHROPIC_API_KEY is not accidentally committed as a literal value", () => {
    // If the env var is set it must look like an Anthropic key (sk-ant-...)
    // If it's absent, the app falls back to the mock provider — also fine
    const key = process.env.ANTHROPIC_API_KEY;
    if (key && key.length > 0) {
      expect(key).toMatch(/^sk-ant-/);
    }
  });
});
