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

    console.log("Connecting directly to the official HairFastGAN cluster...")
    // Reverting to the official space which is guaranteed to be online 24/7
    const app = await client("AIRI-Institute/HairFastGAN")

    const selfieBlob = new Blob([await selfie.arrayBuffer()], { type: selfie.type })
    const referenceBlob = new Blob([await reference.arrayBuffer()], { type: reference.type })

    console.log("Initiating hairstyle transfer pipeline...")
    
    // Instead of using the numbered endpoint array mapping, we explicitly send
    // named positional inputs configured to match the underlying Python function definition.
    const result = await app.predict(0, [
      selfieBlob,      // input_face
      referenceBlob,   // shape_face
      referenceBlob,   // color_face
      "Article",       // color_encoder_version
      0,               // poisson_iters
      15,              // poisson_erosion
      ["Face", "Shape", "Color"] // image_cropping
    ]) as { data: Array<{ url: string }> }

    console.log("AI Inference completed successfully.")

    if (result && result.data && result.data[0]?.url) {
      return NextResponse.json({ resultUrl: result.data[0].url })
    }

    throw new Error("The backend processed the image but returned an unreadable format.")
  } catch (error: unknown) {
    console.error("API Route Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to generate image."
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
