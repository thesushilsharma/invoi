import { db } from "$lib/server/db"
import { payments } from "$lib/server/db/schema"
import { json } from "@sveltejs/kit"


export async function GET() {
  try {
    const allPayments = await db.select().from(payments).orderBy(payments.createdAt)
    return json(allPayments)
  } catch (error) {
    console.error("Failed to fetch payments:", error)
    return json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}
