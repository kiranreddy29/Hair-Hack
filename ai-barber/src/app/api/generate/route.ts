import { NextResponse } from "next/server"
import { client } from "@gradio/client"

export const maxDuration = 60 
export const dynamic = 'force-dynamic'

interface GradioOutput {
  url?: string;
  [key: string]: unknown;
}

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
    const app = await client("AIRI-Institute/HairFastGAN", {})

    const selfieBlob = new Blob([await selfie.arrayBuffer()], { type: selfie.type })
    const referenceBlob = new Blob([await reference.arrayBuffer()], { type: reference.type })

    console.log("Uploading files to temporary hosting nodes...")
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const faceUpload = await app.upload([selfieBlob], "AIRI-Institute/HairFastGAN") as any
    const shapeUpload = await app.upload([referenceBlob], "AIRI-Institute/HairFastGAN") as any

    if (!faceUpload?.meta?.outputs?.[0] || !shapeUpload?.meta?.outputs?.[0]) {
      throw new Error("Failed to pre-stage asset uploads on the remote cluster.")
    }

    const faceData = faceUpload.meta.outputs[0]
    const shapeData = shapeUpload.meta.outputs[0]

    console.log("Simulating native frontend interaction layer...")
    const result = await app.predict(4, [
      faceData,
      shapeData,
      shapeData,
      "Article",
      0,
      15,
    ]) as { data: [GradioOutput, string] }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    console.log("Inference array response parsed.")

    if (result && result.data && result.data.length > 0) {
      const outputObject = result.data[0]
      const internalErrorMessage = result.data[1]

      if (outputObject && outputObject.url) {
        return NextResponse.json({ resultUrl: outputObject.url })
      }

      if (internalErrorMessage) {
        throw new Error(`Model error: ${internalErrorMessage}`)
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
