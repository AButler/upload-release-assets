# Upload Release Assets - GitHub Action

<a href="https://github.com/AButler/upload-release-assets"><img alt="GitHub Actions status" src="https://github.com/AButler/upload-release-assets/workflows/CI/badge.svg"></a>

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

The Upload Release Assets GitHub Action uploads files (base on a glob) to a GitHub release. This is a cross-platform action that runs on any environment.

## Usage

```yml
jobs:
  build:
    # ...
    steps:
      - uses: AButler/upload-release-assets@v3.0
        with:
          files: "artifacts/*;packages/*.nupkg"
          repo-token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Name          | Description                                                                                       | Examples                                                 |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `files`       | The glob of files to upload (semicolon separate multiple globs)                                   | `file.txt` <br> `file*.txt` <br> `file_{a,b}.txt;*.json` |
| `repo-token`  | The GitHub token to use to amend the release _(recommended to use `${{ secrets.GITHUB_TOKEN }}`)_ | `${{ secrets.GITHUB_TOKEN }}`                            |
| `release-id`  | _(Optional)_ Explicitly specify the release id                                                    | `42`                                                     |
| `release-tag` | _(Optional)_ Explicity specify the tag of the release                                             | `v1.0.0`                                                 |

If `release-id` is specified, then this release with this will be used.
If `release-tag` is specified, the release with this tag will be used.
If neither are specified, the release from the action is used.

## Contributors

A big thanks to those who have contributed to this repo:

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/AButler"><img src="https://avatars.githubusercontent.com/u/1628649?v=4?s=100" width="100px;" alt="Andrew Butler"/><br /><sub><b>Andrew Butler</b></sub></a><br /><a href="https://github.com/AButler/upload-release-assets/commits?author=AButler" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/apps/dependabot"><img src="https://avatars.githubusercontent.com/in/29110?v=4?s=100" width="100px;" alt="dependabot[bot]"/><br /><sub><b>dependabot[bot]</b></sub></a><br /><a href="https://github.com/AButler/upload-release-assets/commits?author=dependabot[bot]" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
