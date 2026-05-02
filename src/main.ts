import { run } from "./run";

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
