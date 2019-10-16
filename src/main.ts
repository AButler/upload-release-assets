import * as core from '@actions/core';
import * as github from '@actions/github';
import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

async function run() {
  try {
    let release_id: number = 0;
    const repo = github.context.repo;
    const glob = core.getInput( 'files', { required: true } );
    const tag = core.getInput( 'release-tag' );
    const token = core.getInput( 'repo-token', { required: true } );
    const octokit = new github.GitHub( token );
    
    if ( tag ) {
      core.debug( `Getting release id for ${tag}...` );
      const release = await octokit.repos.getReleaseByTag( { ...repo, tag } );
      
      release_id = release.data.id;
    } else {
      const action = github.context.payload.action;

      switch ( action ) {
        case 'published':
        case 'created':
        case 'prereleased':
          break;
        default:
          // Stop if not correct state, but do not fail
          core.warning( `Cannot upload assets for release which is being ${action}` )
          return;
      }

      release_id = github.context.payload.release.id;
    }

    if ( !release_id ) {
      core.setFailed( 'Could not find release' );
      return;
    }

    core.debug( `Uploading assets to release: ${release_id}...` );

    const files = await fg( glob.split( ';' ) );
    if ( !files.length ) {
      core.setFailed( 'No files found' );
      return;
    }

    const { data: { upload_url: url } } = await octokit.repos.getRelease( { ...repo, release_id } );
    const { data: existingAssets } = await octokit.repos.listAssetsForRelease( { ...repo, release_id } );

    for ( let file of files ) {
      const existingAsset = existingAssets.find( a => a.name === file );
      if ( existingAsset ) {
        core.debug( `Removing existing asset '${file}' with ID ${existingAsset.id}...` );
        octokit.repos.deleteReleaseAsset( {...repo, asset_id: existingAsset.id } )
      }

      const fileName = path.basename( file );
      const fileStream = fs.createReadStream( file );
      const contentType = mime.lookup( file ) || 'application/zip';

      console.log( `Uploading ${file}...` );
      core.debug( `Content-Type = '${contentType}'` );

      const headers = {
        'content-type': contentType,
        'content-length': fs.statSync( file ).size
      };

      await octokit.repos.uploadReleaseAsset( { url, headers, name: fileName, file: fileStream } );
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
