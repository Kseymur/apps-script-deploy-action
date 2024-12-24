import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";

export async function deployToAppsScript(
  scriptId: string,
  srcFolder: string,
  clientId: string,
  clientSecret: string,
  refreshToken: string
) {

  console.log(`srcFolder: ${srcFolder}`);

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });

  const script = google.script({ version: "v1", auth });

  const files = fs.readdirSync(srcFolder).map((fileName) => {
    const filePath = path.join(srcFolder, fileName);
    const fileContent = fs.readFileSync(filePath, "utf8");
    return {
      name: fileName.replace(/\.[^/.]+$/, ""), 
      type: fileName.endsWith(".js") ? "SERVER_JS" : "JSON",
      source: fileContent,
    };
  });

  await script.projects.updateContent({
    scriptId,
    requestBody: { files },
  });

  console.log("Apps Script project content updated!");

  const versionResponse = await script.projects.versions.create({
    scriptId,
    requestBody: { description: "Automated deployment" },
  });

  console.log(`Created version ${versionResponse.data.versionNumber}`);

  const deployments = await script.projects.deployments.list({ scriptId });
  const deploymentId = deployments.data.deployments![0].deploymentId;

  await script.projects.deployments.update({
    scriptId,
    deploymentId: deploymentId!,
    requestBody: { deploymentConfig: { versionNumber: versionResponse.data.versionNumber } },
  });

  console.log("Deployment updated successfully!");
}