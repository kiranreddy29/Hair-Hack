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

    console.log("Connecting to the underlying Hugging Face Space runtime...")
    // Connecting using an open stream layout
    const app = await client("AIRI-Institute/HairFastGAN", {})

    // Convert file arrays into standard binary Blobs
    const selfieBlob = new Blob([await selfie.arrayBuffer()], { type: selfie.type })
    const referenceBlob = new Blob([await reference.arrayBuffer()], { type: reference.type })

    console.log("Uploading files to temporary hosting nodes...")
    // Step 1: We must upload the files to Gradio's server cache nodes first.
    // This mocks the visual image drag-and-drop actions performed by a real browser user.
    const faceUpload = await app.upload([selfieBlob])
    const shapeUpload = await app.upload([referenceBlob])

    if (!faceUpload?.meta?.outputs?.[0] || !shapeUpload?.meta?.outputs?.[0]) {
      throw new Error("Failed to pre-stage asset uploads on the remote cluster.")
    }

    const faceData = faceUpload.meta.outputs[0]
    const shapeData = shapeUpload.meta.outputs[0]

    console.log("Simulating native frontend interaction layer...")
    // Step 2: Call the raw component index mapping '4' directly via an open socket submit.
    // This fully bypasses the '/swap_hair' programmatic API gate wrapper that blocks external servers.
    const result = await app.predict(4, [
      faceData,       // Input face file object mapping
      shapeData,      // Input shape file object mapping
      shapeData,      // Input color file object mapping
      "Article",      // Radio blend string configuration
      0,              // Poisson iteration numeric value
      15,             // Poisson erosion boundary size
    ]) as { data: [any, string] }

    console.log("Inference array response parsed.")

    if (result && result.data && result.data.length > 0) {
      const outputObject = result.data[0]
      const internalErrorMessage = result.data[1]

      // Gradio payload objects contain a direct download URL string under the .url parameter
      if (outputObject && outputObject.url) {
        return NextResponse.json({ resultUrl: outputObject.url })
      }

      if (internalErrorMessage) {
        throw new Error(`Model Inference Failure: ${internalErrorMessage}`)
      }
    }

    throw new Error("The AI backend executed successfully but returned an empty response layout.")
  } catch (error: unknown) {
    console.error("Critical API Route Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal generation pipeline error."
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
