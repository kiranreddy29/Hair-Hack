import { NextResponse } from "next/server"
import { Client, handle_file } from "@gradio/client"
import { writeFile } from "fs/promises"
import { join } from "path"
import os from "os"

export const maxDuration = 60 // Increase max duration if deployed on Vercel
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const startTime = Date.now()
  let tmpSelfiePath = ""
  let tmpReferencePath = ""

  console.log(`[${new Date().toISOString()}] Request received at /api/generate`)

  try {
    const formData = await req.formData()
    const selfie = formData.get("selfie") as File
    const reference = formData.get("reference") as File

    if (!selfie || !reference) {
      console.log(`[${new Date().toISOString()}] Error: Missing files in request.`)
      return NextResponse.json(
        { success: false, error: "Selfie and reference images are required." },
        { status: 400 }
      )
    }

    // Save files to /tmp
    console.log(`[${new Date().toISOString()}] Saving files to /tmp...`)
    const tmpDir = os.tmpdir()
    tmpSelfiePath = join(tmpDir, `selfie-${Date.now()}-${selfie.name}`)
    tmpReferencePath = join(tmpDir, `reference-${Date.now()}-${reference.name}`)

    const selfieBuffer = Buffer.from(await selfie.arrayBuffer())
    const referenceBuffer = Buffer.from(await reference.arrayBuffer())

    await writeFile(tmpSelfiePath, selfieBuffer)
    await writeFile(tmpReferencePath, referenceBuffer)

    console.log(`[${new Date().toISOString()}] Temp files created.`)
    console.log(`[${new Date().toISOString()}] Selfie: ${tmpSelfiePath}`)
    console.log(`[${new Date().toISOString()}] Reference: ${tmpReferencePath}`)

    console.log(`[${new Date().toISOString()}] Connecting to Gradio API via Client.connect...`)
    const app = await Client.connect("AIRI-Institute/HairFastGAN")

    console.log(`[${new Date().toISOString()}] Invoking API /swap_hair...`)
    const result = await app.predict("/swap_hair", {
      face: handle_file(tmpSelfiePath),
      shape: handle_file(tmpReferencePath),
      color: handle_file(tmpReferencePath),
      blending: "Article",
      poisson_iters: 0,
      poisson_erosion: 15,
    }) as { data: [ { url: string }, string ] }

    console.log(`[${new Date().toISOString()}] Raw API Response received:`)
    console.log(JSON.stringify(result, null, 2))

    // Parse the tuple: element 0 = generated image, element 1 = error string
    const generatedImage = result.data[0]
    const errorString = result.data[1]

    if (errorString) {
      console.error(`[${new Date().toISOString()}] HairFastGAN returned an error:`, errorString)
      throw new Error(`HairFastGAN Error: ${errorString}`)
    }

    if (generatedImage && generatedImage.url) {
      const executionTime = Date.now() - startTime
      console.log(`[${new Date().toISOString()}] Total execution time: ${executionTime}ms`)
      return NextResponse.json({ success: true, resultUrl: generatedImage.url })
    }

    console.error(`[${new Date().toISOString()}] Invalid Gradio response format:`, result)
    throw new Error("Invalid response format from HairFastGAN API.")
  } catch (error: unknown) {
    const executionTime = Date.now() - startTime
    console.error(`[${new Date().toISOString()}] API Route Error (Execution Time: ${executionTime}ms):`, error)

    const errorMessage = error instanceof Error ? error.message : "Failed to generate image."
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
