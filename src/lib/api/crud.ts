import { and, eq, ilike, type SQL } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "../db/client";
import { crossRules, parsePartial, zodIssues, type Issues } from "../validation";
import { RESOURCES, type ResourceDef, type ResourceKey } from "./resources";

type Ctx = { params: Promise<{ id: string }> };
type Row = Record<string, unknown>;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public issues?: Issues,
  ) {
    super(message);
  }
}

export function json(data: unknown, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}

/** Maps PostgreSQL constraint errors (also wrapped by drizzle) to HTTP errors. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const e = error as { code?: string; detail?: string; constraint?: string; cause?: { code?: string; detail?: string; constraint?: string } };
  const code = e?.code ?? e?.cause?.code;
  const detail = e?.detail ?? e?.cause?.detail;
  switch (code) {
    case "23505":
      return new ApiError(409, `A record with the same unique key already exists${detail ? ` (${detail})` : ""}`);
    case "23503":
      return new ApiError(422, `Referenced record does not exist or is still in use${detail ? ` (${detail})` : ""}`);
    case "23514":
      return new ApiError(422, "The record violates a data integrity rule");
    case "22P02":
      return new ApiError(400, "Invalid identifier or value format");
  }
  console.error(error);
  return new ApiError(500, "Unexpected server error");
}

export function errorResponse(error: unknown) {
  const apiError = toApiError(error);
  return json({ error: apiError.message, ...(apiError.issues ? { issues: apiError.issues } : {}) }, apiError.status);
}

async function readJson(req: NextRequest): Promise<Row> {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body as Row;
  } catch {
    throw new ApiError(400, "Request body must be a JSON object");
  }
}

/** Validates a full record (create) or a partial one merged onto `existing` (update). */
export function validateRecord(resource: ResourceDef, input: Row, existing?: Row): Row {
  const parsed = existing ? parsePartial(resource.schema, input) : resource.schema.safeParse(input);
  if (!parsed.success) throw new ApiError(422, "Validation failed", zodIssues(parsed.error));
  const data = parsed.data as Row;
  const issues = crossRules[resource.key]({ ...(existing ?? {}), ...data });
  if (Object.keys(issues).length) throw new ApiError(422, "Validation failed", issues);
  return data;
}

const idSchema = z.guid();
function assertId(id: string) {
  if (!idSchema.safeParse(id).success) throw new ApiError(404, "Not found");
}

/** Builds `GET` (list with optional column filters) and `POST` handlers for a collection. */
export function collectionHandlers(key: ResourceKey) {
  const resource = RESOURCES[key];
  const columns = resource.table as unknown as Record<string, unknown>;

  async function GET(req: NextRequest) {
    try {
      const db = await getDb();
      const filters: SQL[] = [];
      for (const [param, value] of req.nextUrl.searchParams) {
        if (param === "q" && "name" in columns) {
          filters.push(ilike(resource.table.name, `%${value}%`));
        } else if (param in resource.schema.shape && param in columns) {
          filters.push(eq(resource.table[param], value));
        }
      }
      const rows = await db
        .select()
        .from(resource.table)
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(...resource.orderBy);
      return json(rows);
    } catch (error) {
      return errorResponse(error);
    }
  }

  async function POST(req: NextRequest) {
    try {
      const data = validateRecord(resource, await readJson(req));
      const db = await getDb();
      const [row] = await db.insert(resource.table).values(data).returning();
      return json(row, 201);
    } catch (error) {
      return errorResponse(error);
    }
  }

  return { GET, POST };
}

/** Builds `GET`, `PATCH`/`PUT` and `DELETE` handlers for a single record. */
export function itemHandlers(key: ResourceKey) {
  const resource = RESOURCES[key];

  async function load(id: string) {
    assertId(id);
    const db = await getDb();
    const [row] = await db.select().from(resource.table).where(eq(resource.table.id, id));
    if (!row) throw new ApiError(404, `${resource.label}: record not found`);
    return row as Row;
  }

  async function GET(_req: NextRequest, ctx: Ctx) {
    try {
      return json(await load((await ctx.params).id));
    } catch (error) {
      return errorResponse(error);
    }
  }

  async function PATCH(req: NextRequest, ctx: Ctx) {
    try {
      const { id } = await ctx.params;
      const existing = await load(id);
      const body = await readJson(req);
      delete body.id;
      const data = validateRecord(resource, body, existing);
      if (Object.keys(data).length === 0) return json(existing);
      const db = await getDb();
      const [row] = await db.update(resource.table).set(data).where(eq(resource.table.id, id)).returning();
      return json(row);
    } catch (error) {
      return errorResponse(error);
    }
  }

  async function DELETE(_req: NextRequest, ctx: Ctx) {
    try {
      const { id } = await ctx.params;
      assertId(id);
      const db = await getDb();
      const deleted = await db.delete(resource.table).where(eq(resource.table.id, id)).returning({ id: resource.table.id });
      if (!deleted.length) throw new ApiError(404, `${resource.label}: record not found`);
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return errorResponse(error);
    }
  }

  return { GET, PATCH, PUT: PATCH, DELETE };
}
