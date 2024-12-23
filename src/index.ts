import * as core from "@actions/core";
import { deployToAppsScript } from "./appsScriptAPI";

async function run() {
  try {
    const scriptId = process.argv[2];  
    const srcFolder = process.argv[3]; 
    const clientId = process.env.CLIENT_ID!;
    const clientSecret = process.env.CLIENT_SECRET!;
    const refreshToken = process.env.REFRESH_TOKEN!;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error("Missing OAuth credentials in environment variables");
    }

    console.log(`srcFolder: ${srcFolder}`);
    console.log(`scriptId: ${scriptId}`);

    await deployToAppsScript(scriptId, srcFolder, clientId, clientSecret, refreshToken);
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

run();