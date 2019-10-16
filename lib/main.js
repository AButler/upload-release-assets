"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mime_types_1 = __importDefault(require("mime-types"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let release_id = 0;
            const repo = github.context.repo;
            const glob = core.getInput('files', { required: true });
            const tag = core.getInput('release-tag');
            const token = core.getInput('repo-token', { required: true });
            const octokit = new github.GitHub(token);
            if (tag) {
                core.debug(`Getting release id for ${tag}...`);
                const release = yield octokit.repos.getReleaseByTag(Object.assign({}, repo, { tag }));
                release_id = release.data.id;
            }
            else {
                const action = github.context.action;
                switch (action) {
                    case 'published':
                    case 'created':
                    case 'prereleased':
                        break;
                    default:
                        // Stop if not correct state, but do not fail
                        core.warning(`Cannot upload assets for release which is being ${action}`);
                        return;
                }
                release_id = github.context.payload.release.id;
            }
            if (!release_id) {
                core.setFailed('Could not find release');
                return;
            }
            core.debug(`Uploading assets to release: ${release_id}...`);
            const files = yield fast_glob_1.default(glob.split(','));
            if (!files.length) {
                core.setFailed('No files found');
                return;
            }
            const { data: { upload_url: url } } = yield octokit.repos.getRelease(Object.assign({}, repo, { release_id }));
            const { data: existingAssets } = yield octokit.repos.listAssetsForRelease(Object.assign({}, repo, { release_id }));
            for (let file of files) {
                const existingAsset = existingAssets.find(a => a.name === file);
                if (existingAsset) {
                    core.debug(`Removing existing asset '${file}' with ID ${existingAsset.id}...`);
                    octokit.repos.deleteReleaseAsset(Object.assign({}, repo, { asset_id: existingAsset.id }));
                }
                const fileName = path_1.default.basename(file);
                const fileStream = fs_1.default.createReadStream(file);
                const contentType = mime_types_1.default.lookup(file) || 'application/zip';
                console.log(`Uploading ${file}...`);
                core.debug(`Content-Type = '${contentType}'`);
                const headers = {
                    'content-type': contentType,
                    'content-length': fs_1.default.statSync(file).size
                };
                const response = yield octokit.repos.uploadReleaseAsset({ url, headers, name: fileName, file: fileStream });
                core.debug(`Assert '${file}' can be downloaded from ${response.data.value.browser_download_url}`);
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
