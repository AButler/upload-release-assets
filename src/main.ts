import * as core from "@actions/core";
import * as github from "@actions/github";
import fg from "fast-glob";
import fs from "fs";
import path from "path";
import mime from "mime-types";

async function run() {
  try {
    const repo = github.context.repo;
    const glob = core.getInput("files", { required: true });
    const tag = core.getInput("release-tag");
    const releaseId = core.getInput("release-id");
    const token = core.getInput("repo-token", { required: true });

    const octokit = github.getOctokit(token);

    let release_id: number = 0;

    if (releaseId && Number.isInteger(parseInt(releaseId))) {
      core.debug(`Using explicit release id ${releaseId}...`);
      release_id = parseInt(releaseId);
    } else if (tag) {
      core.debug(`Getting release id for ${tag}...`);
      const release = await octokit.rest.repos.getReleaseByTag({
        ...repo,
        tag,
      });

      release_id = release.data.id;
    } else {
      core.debug(
        `Using release id from action ${github.context.payload.release.id}...`
      );
      release_id = github.context.payload.release.id;
    }

    if (!release_id) {
      core.setFailed("Could not find release");
      return;
    }

    core.debug(`Uploading assets to release: ${release_id}...`);

    const files = await fg(glob.split(";"));
    if (!files.length) {
      core.setFailed("No files found");
      return;
    }

    const {
      data: { upload_url: upload_url, html_url: html_url },
    } = await octokit.rest.repos.getRelease({ ...repo, release_id });

    const { data: existingAssets } = await octokit.rest.repos.listReleaseAssets(
      {
        ...repo,
        release_id,
      }
    );

    for (let file of files) {
      const existingAsset = existingAssets.find((a: any) => a.name === file);
      if (existingAsset) {
        core.debug(
          `Removing existing asset '${file}' with ID ${existingAsset.id}...`
        );
        octokit.rest.repos.deleteReleaseAsset({
          ...repo,
          asset_id: existingAsset.id,
        });
      }

      const fileName = path.basename(file);
      const fileStream = fs.readFileSync(file);
      const contentType = mime.lookup(file) || "application/zip";

      console.log(`Uploading ${file}...`);
      core.debug(`Content-Type = '${contentType}'`);

      const headers = {
        "content-type": contentType,
        "content-length": fs.statSync(file).size,
      };

      await octokit.rest.repos.uploadReleaseAsset({
        ...repo,
        url: upload_url as string,
        release_id: release_id,
        headers,
        name: fileName,
        // Octokits typings only accept string, but the code also accepts Buffer, so this tricks Typescript into allowing the buffer
        data: fileStream as unknown as string,
      });
    }

    console.log(`Upload complete: ${html_url}`);
  } catch (error: any) {
    const message = error?.message || "Unknown error";
    core.setFailed(message);
  }
}

run();
