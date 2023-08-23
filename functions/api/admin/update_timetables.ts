import { Handler } from "../../_helpers/types.def.js";

export const onRequest: Handler = async (context) => {
  // due to resource limitations, the logic runs outside of
  // CF workers, and uploads the result to this endpoint, which just
  // saves the JSON. It is triggered once a week by GitHub Actions.

  if (
    context.request.method !== "POST" ||
    context.request.headers.get("authentication") !== context.env.UPLOAD_TOKEN
  ) {
    return Response.json({ error: "unauthenticated" });
  }

  const uploadedJson = await context.request.json();
  await context.env.DB.put("tripObj", JSON.stringify(uploadedJson));
  return Response.json({ ok: true });
};
