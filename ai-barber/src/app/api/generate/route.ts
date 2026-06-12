import { NextResponse } from "next/server"
import { client } from "@gradio/client"

export const maxDuration = 60 
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

    console.log("Connecting directly to the official HairFastGAN API...")
    const app = await client("AIRI-Institute/HairFastGAN")

    // Convert file buffers into Base64 Data URLs which are safer for Gradio over the web
    const selfieBuffer = await selfie.arrayBuffer()
    const referenceBuffer = await reference.arrayBuffer()

    const selfieBase64 = `data:${selfie.type};base64,${Buffer.from(selfieBuffer).toString("base64")}`
    const referenceBase64 = `data:${reference.type};base64,${Buffer.from(referenceBuffer).toString("base64")}`

    console.log("Calling /swap_hair endpoint using base64 payloads...")
    
    const result = await app.predict("/swap_hair", {
      face: selfieBase64,
      shape: referenceBase64,
      color: referenceBase64,
      blending: "Article",
      poisson_iters: 0,
      poisson_erosion: 15,
    }) as { data: [string, string] }

    console.log("Gradio API response received.")

    if (result && result.data && result.data.length > 0) {
      const generatedImagePath = result.data[0]
      const potentialError = result.data[1]

      if (generatedImagePath) {
        return NextResponse.json({ resultUrl: generatedImagePath })
      }
      
      if (potentialError) {
        throw new Error(`Model error: ${potentialError}`)
      }
    }

    throw new Error("The backend processed the request but didn't return an image path.")
  } catch (error: unknown) {
    console.error("API Route Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to generate image."
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
