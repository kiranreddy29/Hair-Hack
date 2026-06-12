import { NextResponse } from "next/server"
import { client } from "@gradio/client"

export const maxDuration = 60 // Increase max duration if deployed on Vercel
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const selfie = formData.get("selfie") as File
    const reference = formData.get("reference") as File

    if (!selfie || !reference) {
      return NextResponse.json(
        { error: "Selfie and reference images are required." },
        { status: 400 }
      )
    }

    console.log("Connecting to Gradio API...")
    const app = await client("AIRI-Institute/HairFastGAN")

    console.log("Calling /swap_hair endpoint...")
    const result = await app.predict("/swap_hair", {
      face: selfie,
      shape: reference,
      color: reference,
      blending: "Article",
      poisson_iters: 0,
      poisson_erosion: 15,
    }) as { data: Array<{ url: string }> }

    console.log("Gradio API call successful.")

    if (result && result.data && result.data.length > 0 && result.data[0] && result.data[0].url) {
      return NextResponse.json({ resultUrl: result.data[0].url })
    }

    throw new Error("Invalid response format from HairFastGAN API.")
  } catch (error: unknown) {
    console.error("API Route Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to generate image."
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
