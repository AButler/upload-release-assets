import { getInput, setFailed, debug } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import fg from "fast-glob";
import { readFile } from "fs/promises";
import path from "path";
import mime from "mime-types";

export async function run() {
  try {
    const repo = context.repo;
    const inputGlob = getInput("files", { required: true });
    const inputTag = getInput("release-tag");
    const inputReleaseId = getInput("release-id");
    const token = getInput("repo-token", { required: true });

    const octokit = getOctokit(token);

    let releaseId: number = 0;

    const parsedReleaseId =
      inputReleaseId && /^\d+$/.test(inputReleaseId)
        ? Number.parseInt(inputReleaseId, 10)
        : null;

    if (parsedReleaseId !== null) {
      debug(`Using explicit release id ${parsedReleaseId}...`);
      releaseId = parsedReleaseId;
    } else if (inputTag) {
      debug(`Getting release id for ${inputTag}...`);
      try {
        const release = await octokit.rest.repos.getReleaseByTag({
          ...repo,
          tag: inputTag,
        });

        releaseId = release.data.id;
      } catch (error: unknown) {
        const message =
          (error instanceof Error ? error?.message : null) || "Unknown error";
        setFailed(`Could not get release id for tag ${inputTag}: ${message}`);
        return;
      }
    } else {
      const releaseIdFromPayload = context.payload?.release?.id;
      if (releaseIdFromPayload) {
        debug(`Using release id from action ${releaseIdFromPayload}...`);
        releaseId = releaseIdFromPayload;
      }
    }

    if (!releaseId) {
      setFailed("Could not find release");
      return;
    }

    debug(`Uploading assets to release: ${releaseId}...`);

    const patterns = inputGlob
      .split(";")
      .map((pattern) => pattern.trim())
      .filter((pattern) => pattern.length > 0);

    const files = await fg(patterns);
    if (!files.length) {
      setFailed("No files found");
      return;
    }

    const {
      data: { upload_url: upload_url, html_url: html_url },
    } = await octokit.rest.repos.getRelease({ ...repo, release_id: releaseId });

    const { data: existingAssets } = await octokit.rest.repos.listReleaseAssets(
      {
        ...repo,
        release_id: releaseId,
      },
    );

    for (let file of files) {
      const fileName = path.basename(file);
      const existingAsset = existingAssets.find((a) => a.name === fileName);

      if (existingAsset) {
        debug(
          `Removing existing asset '${file}' with ID ${existingAsset.id}...`,
        );
        await octokit.rest.repos.deleteReleaseAsset({
          ...repo,
          asset_id: existingAsset.id,
        });
      }

      const fileStream = await readFile(file);
      const contentType = mime.lookup(file) || "application/zip";

      console.log(`Uploading ${file}...`);
      debug(`Content-Type = '${contentType}'`);

      const headers = {
        "content-type": contentType,
        "content-length": fileStream.length,
      };

      await octokit.rest.repos.uploadReleaseAsset({
        ...repo,
        url: upload_url as string,
        release_id: releaseId,
        headers,
        name: fileName,
        // Octokits typings only accept string, but the code also accepts Buffer, so this tricks TypeScript into allowing the buffer
        data: fileStream as unknown as string,
      });
    }

    console.log(`Upload complete: ${html_url}`);
  } catch (error: unknown) {
    const message =
      (error instanceof Error ? error?.message : null) || "Unknown error";
    setFailed(message);
  }
}
