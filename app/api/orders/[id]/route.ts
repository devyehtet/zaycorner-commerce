import { getDb, ensureOrdersTable } from "../../../../db";
import { orders } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await context.params;
    const body = await request.json();
    const { status, paymentStatus } = body;

    await ensureOrdersTable();
    const db = getDb();

    const updateData: Record<string, string> = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    if (Object.keys(updateData).length === 0) {
      return Response.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    await db
      .update(orders)
      .set(updateData as never)
      .where(eq(orders.id, orderId));

    return Response.json({ ok: true, message: "Order updated successfully" });
  } catch (error) {
    console.error("Update error:", error);
    return Response.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
