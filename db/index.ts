import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

type D1DatabaseLike = {
  prepare: (query: string) => {
    first: () => Promise<unknown>;
    run: () => Promise<unknown>;
  };
};

export type StoreEnv = { DB?: D1DatabaseLike | null; TELEGRAM_BOT_TOKEN?: string; TELEGRAM_CHAT_ID?: string; ADMIN_EMAIL?: string };

const localOrderStore: Record<string, any>[] = [];

export function getStoreEnv(): StoreEnv {
  const runtime = (globalThis as unknown as { __ZAY_STORE_ENV__?: StoreEnv }).__ZAY_STORE_ENV__;
  if (runtime) return runtime;

  if (process.env.NODE_ENV !== "production") {
    return {
      DB: null,
      ADMIN_EMAIL: "info@yehtet.com",
    };
  }

  throw new Error("Store runtime environment is unavailable.");
}

export async function ensureOrdersTable() {
  const env = getStoreEnv();
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
  const env = getStoreEnv();

  if (!env.DB && process.env.NODE_ENV !== "production") {
    return {
      select() {
        return {
          from() {
            return {
              where() {
                return {
                  orderBy() {
                    return {
                      limit(limitValue: number) {
                        return Promise.resolve([...localOrderStore].slice(0, limitValue));
                      },
                    };
                  },
                };
              },
              orderBy() {
                return {
                  limit(limitValue: number) {
                    return Promise.resolve([...localOrderStore].slice(0, limitValue));
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
    } as any;
  }

  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}
