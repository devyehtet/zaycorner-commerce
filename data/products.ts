export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  emoji: string;
  color: string;
  badge?: string;
  description: string;
};

export const products: Product[] = [
  {
    id: 1,
    name: "Cloud Comfort Headphones",
    category: "Tech",
    price: 89000,
    oldPrice: 109000,
    rating: 4.9,
    reviews: 128,
    emoji: "🎧",
    color: "lemon",
    badge: "BEST SELLER",
    description: "All-day comfort, warm sound and 32-hour battery life.",
  },
  {
    id: 2,
    name: "Everyday Canvas Tote",
    category: "Style",
    price: 32000,
    rating: 4.8,
    reviews: 84,
    emoji: "👜",
    color: "coral",
    badge: "NEW",
    description: "A sturdy carry-all with two pockets and joyful colour.",
  },
  {
    id: 3,
    name: "Studio Ceramic Mug",
    category: "Home",
    price: 26000,
    oldPrice: 31000,
    rating: 4.7,
    reviews: 63,
    emoji: "☕",
    color: "mint",
    description: "Hand-finished stoneware for slow, sunny mornings.",
  },
  {
    id: 4,
    name: "Metro Day Backpack",
    category: "Style",
    price: 76000,
    rating: 4.9,
    reviews: 97,
    emoji: "🎒",
    color: "blue",
    badge: "HOT",
    description: "Lightweight, water-resistant and ready for every commute.",
  },
  {
    id: 5,
    name: "Fresh Loop Bottle",
    category: "Wellness",
    price: 28000,
    rating: 4.6,
    reviews: 52,
    emoji: "🧴",
    color: "peach",
    description: "Double-wall insulation keeps drinks cool for 18 hours.",
  },
  {
    id: 6,
    name: "Weekend Sneakers",
    category: "Style",
    price: 98000,
    oldPrice: 120000,
    rating: 4.8,
    reviews: 116,
    emoji: "👟",
    color: "lilac",
    badge: "−18%",
    description: "Cushioned everyday sneakers made for long city walks.",
  },
  {
    id: 7,
    name: "Glow Desk Lamp",
    category: "Home",
    price: 54000,
    rating: 4.7,
    reviews: 41,
    emoji: "💡",
    color: "lemon",
    description: "Three warm light modes with a clean, compact silhouette.",
  },
  {
    id: 8,
    name: "Pocket Film Camera",
    category: "Tech",
    price: 148000,
    rating: 4.9,
    reviews: 72,
    emoji: "📷",
    color: "coral",
    badge: "LIMITED",
    description: "A playful point-and-shoot for beautifully imperfect moments.",
  },
  {
    id: 9,
    name: "Aroma Diffuser",
    category: "Home",
    price: 68000,
    oldPrice: 82000,
    rating: 4.8,
    reviews: 65,
    emoji: "🕯️",
    color: "mint",
    badge: "NEW",
    description: "Soft ambient scent for calm evenings and brighter spaces.",
  },
  {
    id: 10,
    name: "Trail Coffee Set",
    category: "Wellness",
    price: 39000,
    rating: 4.7,
    reviews: 48,
    emoji: "☕",
    color: "peach",
    description: "A weekend ritual kit for slow mornings and better starts.",
  },
  {
    id: 11,
    name: "Luna Smart Lamp",
    category: "Tech",
    price: 105000,
    rating: 4.9,
    reviews: 80,
    emoji: "💡",
    color: "blue",
    badge: "TOP PICK",
    description: "Wi‑Fi connected mood lighting with touch dimming and scenes.",
  },
  {
    id: 12,
    name: "Cove Travel Case",
    category: "Style",
    price: 43000,
    oldPrice: 56000,
    rating: 4.6,
    reviews: 58,
    emoji: "🧳",
    color: "lilac",
    description: "Compact, organised carry for quick getaways and weekend hops.",
  },
];

export const categories = [
  { name: "All", icon: "✦", color: "coral" },
  { name: "Tech", icon: "⌁", color: "blue" },
  { name: "Style", icon: "✺", color: "lemon" },
  { name: "Home", icon: "⌂", color: "mint" },
  { name: "Wellness", icon: "☻", color: "lilac" },
];

export const money = (value: number) =>
  `${new Intl.NumberFormat("en-US").format(value)} Ks`;
