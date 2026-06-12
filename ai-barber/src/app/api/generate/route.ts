import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const maxDuration = 60 // Increase max duration if deployed on Vercel
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const startTime = Date.now()

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

    console.log(`[${new Date().toISOString()}] Preparing Gemini API call...`)

    if (!process.env.GEMINI_API_KEY) {
       console.error(`[${new Date().toISOString()}] GEMINI_API_KEY is not set.`)
       throw new Error("API key is not configured.")
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

    // Convert files to base64 for Gemini
    const selfieBuffer = Buffer.from(await selfie.arrayBuffer())
    const referenceBuffer = Buffer.from(await reference.arrayBuffer())

    const selfiePart = {
      inlineData: {
        data: selfieBuffer.toString("base64"),
        mimeType: selfie.type
      }
    }

    const referencePart = {
      inlineData: {
        data: referenceBuffer.toString("base64"),
        mimeType: reference.type
      }
    }

    const prompt = "The first image is a customer’s selfie. The second image is a hairstyle reference. Generate a realistic preview showing the customer with the hairstyle from the reference image while preserving facial identity, skin tone, facial features, expression, and overall appearance. Only modify the hairstyle."

    try {
      // NOTE: Standard Gemini API models (e.g. gemini-2.5-flash, gemini-1.5-flash) currently do NOT support generating images.
      // Therefore, this request will either fail or return text. We handle the fallback here gracefully.
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

      console.log(`[${new Date().toISOString()}] Invoking Gemini model...`)
      const result = await model.generateContent([prompt, selfiePart, referencePart])
      const response = await result.response
      const text = response.text()

      console.log(`[${new Date().toISOString()}] Gemini response received. Analysis fallback triggered.`)
      const executionTime = Date.now() - startTime
      console.log(`[${new Date().toISOString()}] Total execution time: ${executionTime}ms`)

      // Fallback: Gemini cannot currently return image edits through the standard API,
      // so we gracefully return the text analysis.
      return NextResponse.json({
        success: true,
        isAnalysis: true,
        analysisText: text,
        message: "Image generation is currently unavailable. Displaying AI hairstyle analysis instead."
      })

    } catch (apiError: unknown) {
      console.error(`[${new Date().toISOString()}] Gemini API error:`, apiError)
      throw apiError
    }

  } catch (error: unknown) {
    const executionTime = Date.now() - startTime
    console.error(`[${new Date().toISOString()}] API Route Error (Execution Time: ${executionTime}ms):`, error)

    const errorMessage = error instanceof Error ? error.message : "Failed to generate image or analysis."
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
