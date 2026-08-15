import { desc, eq, or } from "drizzle-orm";
import { ensureOrdersTable, getDb } from "../../../../db";
import { orders } from "../../../../db/schema";

export async function POST(request: Request) {
  try {
    await ensureOrdersTable();
    const body = await request.json() as { phone?: string; email?: string };
    
    if (!body.phone?.trim() && !body.email?.trim()) {
      return Response.json(
        { error: "Please provide phone number or email" },
        { status: 400 }
      );
    }

    const conditions = [];
    if (body.phone?.trim()) {
      conditions.push(eq(orders.phone, body.phone.trim()));
    }
    if (body.email?.trim()) {
      conditions.push(eq(orders.email, body.email.trim()));
    }

    const userOrders = await getDb()
      .select()
      .from(orders)
      .where(conditions.length > 1 ? or(...conditions) : conditions[0])
      .orderBy(desc(orders.createdAt));

    return Response.json({
      orders: userOrders.map(order => ({
        ...order,
        items: JSON.parse(order.itemsJson)
      }))
    });
  } catch (error) {
    console.error("Order lookup error:", error);
    return Response.json(
      { error: "Could not retrieve orders" },
      { status: 500 }
    );
  }
}
