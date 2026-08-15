import { getDb, getStoreEnv, ensureOrdersTable } from "../../../db";
import { orders } from "../../../db/schema";

const PRODUCTS = [
  { id: 1, name: "Shan Noodles", price: 26000 },
  { id: 2, name: "Shan Fried Rice Mix", price: 28000 },
  { id: 3, name: "Shan Curry Paste", price: 32000 },
  { id: 4, name: "Golden Eagle Tea", price: 45000 },
  { id: 5, name: "Myanmar Coffee", price: 52000 },
  { id: 6, name: "Dried Shrimp", price: 68000 },
  { id: 7, name: "Preserved Fish", price: 85000 },
  { id: 8, name: "Premium Longyi", price: 148000 },
];

const CITIES = [
  "Yangon",
  "Mandalay",
  "Naypyidaw",
  "Bagan",
  "Inle Lake",
  "Taunggyi",
  "Mawlamyine",
];
const COUNTRIES = ["Myanmar", "Thailand", "Singapore"];
const PAYMENT_METHODS = ["cod", "bank_transfer"];
const STATUSES = ["new", "processing", "shipped", "delivered"];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `ZC-${year}${month}${day}-${rand}`;
}

function generateItems() {
  const numItems = Math.floor(Math.random() * 4) + 1;
  const items = [];
  for (let i = 0; i < numItems; i++) {
    const product = getRandomItem(PRODUCTS);
    const qty = Math.floor(Math.random() * 3) + 1;
    items.push({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: qty,
    });
  }
  return items;
}

export async function POST(request: Request) {
  const requestHeaders = new Headers(request.headers);
  const host = requestHeaders.get("host") ?? "";
  const isLocalHost = host.includes("localhost") || host.includes("127.0.0.1");

  if (!isLocalHost) {
    return Response.json(
      { error: "Only available in local development" },
      { status: 403 }
    );
  }

  try {
    await ensureOrdersTable();

    const db = getDb();
    const count = parseInt(new URL(request.url).searchParams.get("count") || "15");
    const createdOrders = [];

    for (let i = 0; i < count; i++) {
      const items = generateItems();
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shipping = subtotal > 100000 ? 0 : 4000;
      const total = subtotal + shipping;

      const orderData = {
        id: crypto.randomUUID(),
        orderNumber: generateOrderNumber(),
        customerName: ["Ye Htet Aung", "Test User", "Admin User", "Ma Su Yi", "Kyaw Soe", "Zaw Lin", "Thu Riya"][i % 7],
        phone: ["09" + Math.floor(Math.random() * 1000000000).toString().padStart(9, "0")][0],
        email: `customer${i}@zaycorner.test`,
        country: getRandomItem(COUNTRIES),
        city: getRandomItem(CITIES),
        address: `${100 + i} Main Street, ${getRandomItem(CITIES)}`,
        paymentMethod: getRandomItem(PAYMENT_METHODS),
        paymentStatus: getRandomItem(["cod", "awaiting_payment", "paid"]),
        status: getRandomItem(STATUSES),
        itemsJson: JSON.stringify(items),
        subtotal,
        shipping,
        total,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await db.insert(orders).values(orderData as never);
      createdOrders.push(orderData);
    }

    return Response.json({
      ok: true,
      message: `Created ${count} test orders`,
      orders: createdOrders,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return Response.json(
      { error: "Failed to seed orders" },
      { status: 500 }
    );
  }
}
