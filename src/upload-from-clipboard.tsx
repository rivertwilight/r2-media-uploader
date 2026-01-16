import { Clipboard } from "@raycast/api";
import { useEffect, useState } from "react";
import { ErrorView } from "./components/ErrorView";
import { UploadForm } from "./components/UploadForm";
import { buildBucketOptions, buildDomainOptions } from "./lib/options";
import { loadPreferences } from "./lib/prefs";
import type { UploadSource } from "./lib/upload";

type ClipboardResolved = { source: UploadSource; label: string } | null;

async function readClipboardSource(): Promise<ClipboardResolved> {
  // Prefer image data if present
  const image = await Clipboard.readImage();
  if (image) {
    const raw = Buffer.from(image, "base64");
    return {
      source: { kind: "buffer", buffer: raw, originalFileName: `clipboard-${Date.now()}.png` },
      label: "clipboard image",
    };
  }

  // Fallback: if clipboard contains a file path (e.g. copied file in Finder), upload that
  const content = (await Clipboard.read()) as unknown as { file?: string };
  const filePath = content?.file;
  if (filePath) {
    return { source: { kind: "file-path", filePath }, label: "clipboard file" };
  }

  return null;
}

export default function Command() {
  const { prefs, profiles } = loadPreferences();
  const [resolved, setResolved] = useState<ClipboardResolved | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await readClipboardSource();
        setResolved(r);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, []);

  const bucketOptions = buildBucketOptions({ profiles, prefs });
  const domainOptions = buildDomainOptions({ profiles, prefs });

  if (!bucketOptions.length) {
    return <ErrorView title="No buckets configured" message="Add **Bucket Names** or **Bucket Profiles (JSON)**." />;
  }
  if (loadError) {
    return <ErrorView title="Can't read clipboard" message={loadError} />;
  }
  if (resolved === undefined) {
    return <ErrorView title="Loading…" message="Reading clipboard…" />;
  }
  if (resolved === null) {
    return (
      <ErrorView
        title="No image/video/file in clipboard"
        message="Copy an image, or copy a file in Finder (e.g. a video), then run this command again."
      />
    );
  }

  const title = "Upload from Clipboard";

  // Always show the form (bucket + domain), per request.
  return (
    <UploadForm
      title={title}
      prefs={prefs}
      bucketOptions={bucketOptions}
      domainOptions={domainOptions}
      sources={[resolved.source]}
    />
  );
}
