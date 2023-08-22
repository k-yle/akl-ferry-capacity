import { FERRY_ROUTES, FERRY_TERMINALS } from "../_helpers/constants.js";
import { Handler } from "../_helpers/types.def.js";

export const onRequest: Handler = async () => {
  return new Response(
    JSON.stringify({ routes: FERRY_ROUTES, terminals: FERRY_TERMINALS })
  );
};
