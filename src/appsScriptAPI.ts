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

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });

  const script = google.script({ version: "v1", auth });

  const files = fs.readdirSync(srcFolder).map((fileName) => {
    const filePath = path.join(srcFolder, fileName);
    const fileContent = fs.readFileSync(filePath, "utf8");
    return {
      name: fileName.replace(/\.[^/.]+$/, ""),
      type: fileName.endsWith(".js")
      ? "SERVER_JS"
      : fileName.endsWith(".html")
      ? "HTML"
      : "JSON",
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
  const newVersion = versionResponse.data.versionNumber!;
  console.log(`Created version ${newVersion}`);

  const listResp = await script.projects.deployments.list({ scriptId });
  const deployments = listResp.data.deployments;
  
  if (!deployments || deployments.length === 0) {
    console.log("No existing deployments found. Creating new deployment...");
    
    const newDeploymentResponse = await script.projects.deployments.create({
      scriptId,
      requestBody: {
        versionNumber: newVersion,
        description: "Initial automated deployment",
        manifestFileName: "appsscript"
      },
    });
    
    const newDeploymentId = newDeploymentResponse.data.deploymentId!;
    console.log(`Created new deployment ${newDeploymentId} with version ${newVersion}`);
    return;
  }

  const lastDeployment = deployments[deployments.length - 1];
  
  if (!lastDeployment.deploymentId) {
    throw new Error("Last deployment has no valid deployment ID");
  }
  
  const deploymentId = lastDeployment.deploymentId;

  await script.projects.deployments.update({
  scriptId,
  deploymentId,
  requestBody: {
    deploymentConfig: {
      versionNumber: newVersion,
      description: "Updated by automated deployment",
      manifestFileName: "appsscript"
    }
  },
});

  console.log(`Deployment ${deploymentId} updated to version ${newVersion}`);
}
