## Upload Release Assets - GitHub Action

<a href="https://github.com/AButler/upload-release-assets"><img alt="GitHub Actions status" src="https://github.com/AButler/upload-release-assets/workflows/CI/badge.svg"></a>

The Upload Release Assets GitHub Action uploads files (base on a glob) to a GitHub release. This is a cross-platform action that runs on any environment.

### Usage

```yml
jobs:
  build:
    # ...
    steps:
      - uses: AButler/upload-release-assets@v1.0
        with:
          files: 'artifacts/*,packages/*.nupkg'
          repo-token: ${{ secrets.GITHUB_TOKEN }}
```

### Inputs

