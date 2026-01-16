# R2 Media Uploader

Upload images & videos to R2

## Setup

Open Raycast → Extensions → **R2 Media Uploader** → Preferences:

- **Cloudflare Account ID**
- **R2 Access Key ID**
- **R2 Secret Access Key**
- **Bucket Names (Comma-separated, Optional)**: quick bucket list for the upload form
- **Custom Domains (Comma-separated, Optional)**: quick domain list for the upload form
- **Default Folder Template** + **Default Filename Template**: used when the selected bucket has no per-bucket template (example below)
- **Bucket Profiles (JSON, Optional)**: advanced per-bucket templates + per-bucket `publicBaseUrl` (example below)

```json
[
  {
    "name": "images",
    "bucket": "my-images",
    "keyTemplate": "uploads/{yyyy}/{mm}/{dd}/{uuid}.{ext}",
    "publicBaseUrl": "https://img.example.com"
  },
  {
    "name": "videos",
    "bucket": "my-videos",
    "keyTemplate": "videos/{yyyy}/{mm}/{dd}/{uuid}.{ext}",
    "publicBaseUrl": "https://vid.example.com"
  }
]
```

## Key templates

Supported placeholders:

- `{yyyy}` `{mm}` `{dd}` `{HH}` `{MM}` `{SS}`
- `{time}` (e.g. `20260116153045`)
- `{uuid}` (random id)
- `{filename}` `{name}` `{ext}`

## Behavior

- **Upload Selected Files**: uploads the currently selected Finder files (multiple files supported). Always shows a form to choose **Bucket** + **Domain**.
- **Upload from Clipboard**: uploads an image from clipboard; if you copied a file in Finder (e.g. a video), it uploads that file. Always shows a form to choose **Bucket** + **Domain**.
- If **Auto Copy URL After Upload** is enabled, the final URL(s) are copied to clipboard (multiple URLs are newline-separated).

## Notes

- The upload form **remembers your last selected bucket + domain** (memoized via Raycast local storage).