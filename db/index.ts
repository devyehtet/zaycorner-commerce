import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "./schema";

type D1DatabaseLike = {
  prepare: (query: string) => {
    first: () => Promise<unknown>;
    run: () => Promise<unknown>;
  };
};

export type StoreEnv = { DB?: D1DatabaseLike | null; TELEGRAM_BOT_TOKEN?: string; TELEGRAM_CHAT_ID?: string; ADMIN_EMAIL?: string };

const localOrderStore: Record<string, any>[] = [];

export function getLocalOrders() {
  return [...localOrderStore].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getStoreEnv(): StoreEnv {
  const runtime = (globalThis as unknown as { __ZAY_STORE_ENV__?: StoreEnv }).__ZAY_STORE_ENV__;
  if (runtime) return runtime;

  return {
    DB: null,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || "info@yehtet.com",
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  };
}

export async function ensureOrdersTable() {
  const env = getStoreEnv();

  if (process.env.POSTGRES_URL) {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS orders (
          id text PRIMARY KEY,
          order_number text NOT NULL UNIQUE,
          customer_name text NOT NULL,
          phone text NOT NULL,
          email text,
          country text NOT NULL,
          city text NOT NULL,
          address text NOT NULL,
          payment_method text NOT NULL,
          payment_status text NOT NULL DEFAULT 'pending',
          status text NOT NULL DEFAULT 'new',
          items_json text NOT NULL,
          subtotal integer NOT NULL,
          shipping integer NOT NULL,
          total integer NOT NULL,
          created_at text NOT NULL
        )
      `;
      return;
    } catch (error) {
      console.warn("ensureOrdersTable Postgres check failed:", error);
    }
  }

  if (!env.DB) return;

  try {
    const existing = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'orders'"
    ).first();

    if (!existing) {
      await env.DB
        .prepare(`
          CREATE TABLE IF NOT EXISTS orders (
            id text PRIMARY KEY NOT NULL,
            order_number text NOT NULL,
            customer_name text NOT NULL,
            phone text NOT NULL,
            email text,
            country text NOT NULL,
            city text NOT NULL,
            address text NOT NULL,
            payment_method text NOT NULL,
            payment_status text DEFAULT 'pending' NOT NULL,
            status text DEFAULT 'new' NOT NULL,
            items_json text NOT NULL,
            subtotal integer NOT NULL,
            shipping integer NOT NULL,
            total integer NOT NULL,
            created_at text NOT NULL
          )
        `)
        .run();

      await env.DB
        .prepare(`
          CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_unique
          ON orders (order_number)
        `)
        .run();
    }
  } catch (error) {
    console.warn("ensureOrdersTable failed:", error);
  }
}

export function getDb() {
  if (process.env.POSTGRES_URL) {
    return drizzle(sql, { schema });
  }

  const env = getStoreEnv();

  if (env.DB) {
    return drizzleD1(env.DB as never, { schema });
  }

  return {
    select() {
      return {
        from() {
          return {
            where(whereClause: (row: Record<string, any>) => boolean) {
              return {
                orderBy(sorter: (a: Record<string, any>, b: Record<string, any>) => number) {
                  return {
                    limit(limitValue: number) {
                      const rows = [...localOrderStore].filter((row) => whereClause(row));
                      return Promise.resolve(rows.sort(sorter).slice(0, limitValue));
                    },
                  };
                },
              };
            },
            orderBy(sorter: (a: Record<string, any>, b: Record<string, any>) => number) {
              return {
                limit(limitValue: number) {
                  const rows = [...localOrderStore].sort(sorter);
                  return Promise.resolve(rows.slice(0, limitValue));
                },
              };
            },
          };
        },
      };
    },
    insert() {
      return {
        values(record: Record<string, any>) {
          localOrderStore.unshift(record);
          return Promise.resolve({
            meta: { rowsAffected: 1 },
          });
        },
      };
    },
    update() {
      return {
        set(patch: Record<string, any>) {
          return {
            where(predicate: (row: Record<string, any>) => boolean) {
              let matched = 0;
              for (const row of localOrderStore) {
                if (predicate(row)) {
                  Object.assign(row, patch);
                  matched += 1;
                }
              }
              return Promise.resolve({
                meta: { rowsAffected: matched },
              });
            },
          };
        },
      };
    },
  } as any;
}
