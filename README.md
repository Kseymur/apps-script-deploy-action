# Apps Script Deploy Action

This GitHub Action automates the deployment of Google Apps Script projects using the Apps Script API. It simplifies updating your Apps Script code from a GitHub repository and handles versioning and deployment automatically.

## Features

- Automatically updates the content of your Apps Script project.
- Creates a new version of the script.
- Updates the active deployment to the latest version.

## Inputs

| Name         | Description                                    | Required |
|--------------|------------------------------------------------|----------|
| `script_id`  | The Apps Script project ID                    | Yes      |
| `src_folder` | Folder containing script files (`.js`, `.json`)| Yes      |

## Environment Variables

| Name            | Description                   | Required |
|-----------------|-------------------------------|----------|
| `CLIENT_ID`     | OAuth2 client ID             | Yes      |
| `CLIENT_SECRET` | OAuth2 client secret         | Yes      |
| `REFRESH_TOKEN` | OAuth2 refresh token         | Yes      |