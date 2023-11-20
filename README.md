# Upload Release Assets - GitHub Action

<a href="https://github.com/AButler/upload-release-assets"><img alt="GitHub Actions status" src="https://github.com/AButler/upload-release-assets/workflows/CI/badge.svg"></a>

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)
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
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td align="center" size="13px" colspan="7">
        <img src="https://raw.githubusercontent.com/all-contributors/all-contributors-cli/1b8533af435da9854653492b1327a23a4dbd0a10/assets/logo-small.svg">
          <a href="https://all-contributors.js.org/docs/en/bot/usage">Add your contributions</a>
        </img>
      </td>
    </tr>
  </tfoot>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
