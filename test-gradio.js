import { client } from "@gradio/client";

async function run() {
  const app = await client("AIRI-Institute/HairFastGAN");
  const info = await app.view_api();
  console.log(JSON.stringify(info, null, 2));
}
run().catch(console.error);
