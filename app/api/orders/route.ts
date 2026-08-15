import { desc } from "drizzle-orm";
import { ensureOrdersTable, getDb, getLocalOrders, getStoreEnv } from "../../../db";
import { orders } from "../../../db/schema";
import { products } from "../../../data/products";
import { getChatGPTUser } from "../../chatgpt-auth";

const catalog = Object.fromEntries(
  products.map((product) => [product.id, { name: product.name, price: product.price }]),
) as Record<number, { name: string; price: number }>;

function isLocalDevRequest(request: Request): boolean {
  const host = request.headers.get("host") ?? request.headers.get("x-forwarded-host") ?? "";
  return /localhost|127\.0\.0\.1|0\.0\.0\.0|terminal\.local|localtest\.me/i.test(host) || process.env.NODE_ENV !== "production";
}

export async function GET(request: Request){
  const user=await getChatGPTUser(),bindings=getStoreEnv();
  if (!isLocalDevRequest(request) && (!user || user.email.toLowerCase() !== (bindings.ADMIN_EMAIL || "info@yehtet.com").toLowerCase())) {
    return Response.json({error:"Unauthorized"},{status:401});
  }

  if (!process.env.POSTGRES_URL && !bindings.DB) {
    return Response.json({ orders: getLocalOrders() });
  }

  await ensureOrdersTable();
  return Response.json({orders:await getDb().select().from(orders).orderBy(desc(orders.createdAt)).limit(100)});
}

export async function POST(request:Request){
  try{
    const isLocalDev = isLocalDevRequest(request);
    await ensureOrdersTable();
    const body=await request.json() as {customerName?:string;phone?:string;email?:string;country?:string;city?:string;address?:string;paymentMethod?:string;items?:{id:number;quantity:number}[]};
    
    // Validate all required fields
    if(!body.customerName?.trim()){return Response.json({error:"Please enter your full name."},{status:400});}
    if(!body.phone?.trim()){return Response.json({error:"Please enter your phone number."},{status:400});}
    if(!body.country){return Response.json({error:"Please select a country."},{status:400});}
    if(!body.city?.trim()){return Response.json({error:"Please enter your city or township."},{status:400});}
    if(!body.address?.trim()){return Response.json({error:"Please enter your delivery address."},{status:400});}
    if(!body.paymentMethod){return Response.json({error:"Please select a payment method."},{status:400});}
    if(!body.items?.length){return Response.json({error:"Your order is empty."},{status:400});}
    
    const items=body.items.map(item=>({id:item.id,quantity:Math.max(1,Math.min(10,Math.floor(item.quantity))),product:catalog[item.id]}));
    if(items.some(item=>!item.product)){return Response.json({error:"A product is unavailable."},{status:400});}
    
    const subtotal=items.reduce((sum,item)=>sum+item.product.price*item.quantity,0),shipping=subtotal>=100000?0:4000,total=subtotal+shipping;
    const now=new Date().toISOString(),id=crypto.randomUUID(),orderNumber=`ZC-${now.slice(2,10).replaceAll("-","")}-${id.slice(0,4).toUpperCase()}`;
    
    await getDb().insert(orders).values({id,orderNumber,customerName:body.customerName.trim(),phone:body.phone.trim(),email:body.email?.trim()||null,country:body.country,city:body.city.trim(),address:body.address.trim(),paymentMethod:body.paymentMethod,paymentStatus:body.paymentMethod==="cod"?"cod":"awaiting_payment",status:"new",itemsJson:JSON.stringify(items.map(item=>({id:item.id,name:item.product.name,quantity:item.quantity,price:item.product.price}))),subtotal,shipping,total,createdAt:now});
    
    const bindings=getStoreEnv();
    if(bindings.TELEGRAM_BOT_TOKEN&&bindings.TELEGRAM_CHAT_ID)await fetch(`https://api.telegram.org/bot${bindings.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({chat_id:bindings.TELEGRAM_CHAT_ID,text:`New order ${orderNumber}\n${body.customerName} · ${body.country}\n${total.toLocaleString()} Ks · ${body.paymentMethod.toUpperCase()}`})}).catch(()=>null);
    
    return Response.json({ok:true,orderNumber,total,paymentMethod:body.paymentMethod,configurationRequired:body.paymentMethod==="card"});
  }catch(error){
    console.error("Order creation error:",error);
    return Response.json({error:"Unable to create order. Please check your connection and try again."},{status:500});
  }
}
