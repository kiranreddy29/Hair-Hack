import { NextResponse } from "next/server";
import { client } from "@gradio/client";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    console.log("\n==============================");
    console.log("🚀 /api/generate called");
    console.log("==============================");

    // -----------------------------
    // Parse form data
    // -----------------------------
    const formData = await req.formData();

    const selfie = formData.get("selfie") as File | null;
    const reference = formData.get("reference") as File | null;

    console.log("📁 Uploaded Files:");
    console.log({
      selfieExists: !!selfie,
      selfieName: selfie?.name,
      selfieType: selfie?.type,
      selfieSize: selfie?.size,

      referenceExists: !!reference,
      referenceName: reference?.name,
      referenceType: reference?.type,
      referenceSize: reference?.size,
    });

    if (!selfie || !reference) {
      console.error("❌ Missing uploaded files");
      return NextResponse.json(
        {
          error: "Selfie and reference images are required.",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // Connect to HF Space
    // -----------------------------
    console.log("🔌 Connecting to HairFastGAN...");

    const app = await client("AIRI-Institute/HairFastGAN");

    console.log("✅ Connected successfully.");

    // -----------------------------
    // Convert files
    // -----------------------------
    console.log("🧠 Creating blobs...");

    const selfieBlob = new Blob(
      [await selfie.arrayBuffer()],
      { type: selfie.type }
    );

    const referenceBlob = new Blob(
      [await reference.arrayBuffer()],
      { type: reference.type }
    );

    console.log("✅ Blob creation complete.");

    // -----------------------------
    // Upload assets
    // -----------------------------
    console.log("⬆️ Uploading selfie...");

    const faceUpload = await app.upload([selfieBlob]);

    console.log("✅ Selfie upload result:");
    console.dir(faceUpload, { depth: null });

    console.log("⬆️ Uploading reference...");

    const shapeUpload = await app.upload([referenceBlob]);

    console.log("✅ Reference upload result:");
    console.dir(shapeUpload, { depth: null });

    const faceData = faceUpload?.meta?.outputs?.[0];
    const shapeData = shapeUpload?.meta?.outputs?.[0];

    console.log("📦 Parsed Upload Data:");
    console.dir(
      {
        faceData,
        shapeData,
      },
      { depth: null }
    );

    if (!faceData || !shapeData) {
      throw new Error(
        "Upload succeeded but returned invalid metadata."
      );
    }

    // -----------------------------
    // Predict
    // -----------------------------
    console.log("🤖 Starting prediction...");

    const result = await app.predict(4, [
      faceData,
      shapeData,
      shapeData,
      "Article",
      0,
      15,
    ]);

    console.log("✅ Raw prediction result:");
    console.dir(result, { depth: null });

    // -----------------------------
    // Extract URL
    // -----------------------------
    const resultAny = result as any;

    if (resultAny?.data) {
      console.log("📄 result.data:");
      console.dir(resultAny.data, { depth: null });

      const maybeImage = resultAny.data[0];

      if (maybeImage?.url) {
        console.log("🎉 SUCCESS");
        console.log("Generated URL:", maybeImage.url);

        console.log(
          `⏱ Took ${(Date.now() - startTime) / 1000}s`
        );

        return NextResponse.json({
          success: true,
          resultUrl: maybeImage.url,
        });
      }
    }

    console.error("❌ Could not extract generated image.");

    return NextResponse.json(
      {
        success: false,
        error: "Prediction succeeded but no image URL found.",
        raw: resultAny,
      },
      {
        status: 500,
      }
    );
  } catch (err: any) {
    console.error("\n==============================");
    console.error("💥 API ERROR");
    console.error("==============================");

    console.error(err);

    if (err?.stack) {
      console.error(err.stack);
    }

    return NextResponse.json(
      {
        success: false,
        error: err?.message ?? "Unknown error",
      },
      {
        status: 500,
      }
    );
  } finally {
    console.log(
      `🏁 Finished in ${(Date.now() - startTime) / 1000}s`
    );
    console.log("==============================\n");
  }
}
