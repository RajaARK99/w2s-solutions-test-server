import "dotenv/config";

import { server } from "./api/index";

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server is running.`);
});
