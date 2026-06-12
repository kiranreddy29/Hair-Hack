import { NextResponse } from "next/server"
import { client } from "@gradio/client"

export const maxDuration = 60 
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    [span_2](start_span)const formData = await req.formData()[span_2](end_span)
    [span_3](start_span)const selfie = formData.get("selfie") as File[span_3](end_span)
    [span_4](start_span)const reference = formData.get("reference") as File[span_4](end_span)

    [span_5](start_span)if (!selfie || !reference) {[span_5](end_span)
      [span_6](start_span)return NextResponse.json([span_6](end_span)
        { error: "Selfie and reference images are required." [span_7](start_span)},[span_7](end_span)
        [span_8](start_span){ status: 400 }[span_8](end_span)
      )
    }

    console.log("Connecting directly to the official HairFastGAN API...")
    [span_9](start_span)const app = await client("AIRI-Institute/HairFastGAN")[span_9](end_span)

    // Convert file buffers into explicitly typed Blobs for seamless multipart transport
    const selfieBlob = new Blob([await selfie.arrayBuffer()], { type: selfie.type })
    const referenceBlob = new Blob([await reference.arrayBuffer()], { type: reference.type })

    console.log("Calling /swap_hair endpoint with the 6 official parameters...")
    
    // We target the named api_name: "/swap_hair" directly as specified in the docs
    const result = await app.predict("/swap_hair", {
      face: selfieBlob,
      shape: referenceBlob,
      color: referenceBlob,
      [span_10](start_span)blending: "Article",[span_10](end_span)
      [span_11](start_span)poisson_iters: 0,[span_11](end_span)
      [span_12](start_span)poisson_erosion: 15,[span_12](end_span)
    }) as { data: [string, string] } // Returns a tuple: [0] is the result path, [1] is the error log

    console.log("Gradio API response received:", result)

    // Check if the response contains data array elements
    if (result && result.data && result.data.length > 0) {
      const generatedImagePath = result.data[0] // The filepath string is at index 0
      const potentialError = result.data[1]     // Any internal error text is at index 1

      if (generatedImagePath) {
        [span_13](start_span)return NextResponse.json({ resultUrl: generatedImagePath })[span_13](end_span)
      }
      
      if (potentialError) {
        throw new Error(`Model error: ${potentialError}`)
      }
    }

    [span_14](start_span)throw new Error("The backend processed the request but didn't return an image path.")[span_14](end_span)
  [span_15](start_span)} catch (error: unknown) {[span_15](end_span)
    [span_16](start_span)console.error("API Route Error:", error)[span_16](end_span)
    [span_17](start_span)const errorMessage = error instanceof Error ? error.message : "Failed to generate image."[span_17](end_span)
    [span_18](start_span)return NextResponse.json([span_18](end_span)
      [span_19](start_span){ error: errorMessage },[span_19](end_span)
      [span_20](start_span){ status: 500 }[span_20](end_span)
    )
  }
}
