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
      type: /\.(js|gs)$/.test(fileName)
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
  const deployments = listResp.data.deployments ?? [];

  const editableDeployments = deployments.filter((d) =>
    d.deploymentId !== "HEAD" &&
    d.deploymentConfig?.versionNumber
  );

  if (editableDeployments.length === 0) {
    const { data: { deploymentId: newDeploymentId } } =
      await script.projects.deployments.create({
        scriptId,
        requestBody: {
          versionNumber: newVersion,
          manifestFileName: "appsscript",
          description: "Initial CI deployment",
        },
      });

    console.log(
      `Created new deployment ${newDeploymentId} (version ${newVersion})`
    );
  } else {
    const current = editableDeployments
      .sort(
        (a, b) =>
          (a.updateTime ?? "") > (b.updateTime ?? "")
            ? 1
            : a.updateTime === b.updateTime
            ? (a.deploymentConfig!.versionNumber! > b.deploymentConfig!.versionNumber! ? 1 : -1)
            : -1
      )
      .at(-1)!;

    await script.projects.deployments.update({
      scriptId,
      deploymentId: current.deploymentId!,
      requestBody: {
        deploymentConfig: {
          versionNumber: newVersion,
          manifestFileName: "appsscript",
          description: `CI deploy v${newVersion}`,
        },
      },
    });

    console.log(
      `Deployment ${current.deploymentId} updated to version ${newVersion}`
    );
  }
}
