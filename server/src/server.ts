import { app } from "@/app";
import { env } from "@/config/env";

app.listen(env.port, () => {
  console.log(`🚀 سرور روی http://localhost:${env.port} بالا اومد`);
});
