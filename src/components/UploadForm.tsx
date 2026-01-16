import { Action, ActionPanel, Clipboard, Form, LocalStorage, popToRoot, showToast, Toast } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import type { BucketOption, DomainOption } from "../lib/options";
import { resolvePublicBaseUrl } from "../lib/options";
import type { Preferences } from "../lib/types";
import { uploadToR2, type UploadSource } from "../lib/upload";

const LS_LAST_BUCKET_ID = "r2u:lastBucketId";
const LS_LAST_DOMAIN_VALUE = "r2u:lastDomainValue";

type FormValues = {
  bucketId: string;
  domainValue: string;
};

export function UploadForm(props: {
  title: string;
  prefs: Pick<
    Preferences,
    | "accountId"
    | "accessKeyId"
    | "secretAccessKey"
    | "autoCopyUrl"
    | "defaultFolderTemplate"
    | "defaultFilenameTemplate"
  >;
  bucketOptions: BucketOption[];
  domainOptions: DomainOption[];
  sources: UploadSource[];
}) {
  const { title, prefs, bucketOptions, domainOptions, sources } = props;

  const defaultBucketId = bucketOptions[0]?.id;
  const defaultDomainValue = domainOptions[0]?.value;

  const [initialValues, setInitialValues] = useState<FormValues | null>(null);

  useEffect(() => {
    (async () => {
      const lastBucketId = (await LocalStorage.getItem<string>(LS_LAST_BUCKET_ID)) || undefined;
      const lastDomainValue = (await LocalStorage.getItem<string>(LS_LAST_DOMAIN_VALUE)) || undefined;

      const bucketOk =
        lastBucketId && bucketOptions.some((b) => b.id === lastBucketId) ? lastBucketId : defaultBucketId;
      const domainOk =
        lastDomainValue && domainOptions.some((d) => d.value === lastDomainValue)
          ? lastDomainValue
          : defaultDomainValue;

      setInitialValues({ bucketId: bucketOk || "", domainValue: domainOk || "r2" });
    })();
  }, [bucketOptions, defaultBucketId, defaultDomainValue, domainOptions]);

  const bucketById = useMemo(() => new Map(bucketOptions.map((b) => [b.id, b])), [bucketOptions]);

  async function onSubmit(values: FormValues) {
    const bucketOpt = bucketById.get(values.bucketId);
    if (!bucketOpt) {
      await showToast({ style: Toast.Style.Failure, title: "Invalid bucket selection" });
      return;
    }

    await LocalStorage.setItem(LS_LAST_BUCKET_ID, values.bucketId);
    await LocalStorage.setItem(LS_LAST_DOMAIN_VALUE, values.domainValue);

    const publicBaseUrl = resolvePublicBaseUrl({ prefs, bucket: bucketOpt.bucket, domainValue: values.domainValue });

    const fallbackKeyConfig = {
      pathPrefix: prefs.defaultFolderTemplate?.trim() || "uploads/{yyyy}/{mm}/{dd}",
      filenameTemplate: prefs.defaultFilenameTemplate?.trim() || "{name}_{time}.{ext}",
    };

    const toast = await showToast({ style: Toast.Style.Animated, title: "Uploading…" });
    try {
      const urls: string[] = [];
      for (let i = 0; i < sources.length; i++) {
        toast.message = sources.length > 1 ? `Uploading ${i + 1}/${sources.length}` : undefined;
        const res = await uploadToR2({
          prefs,
          bucket: bucketOpt.bucket,
          keyConfig: {
            keyTemplate: bucketOpt.keyTemplate,
            pathPrefix: bucketOpt.pathPrefix || fallbackKeyConfig.pathPrefix,
            filenameTemplate: bucketOpt.filenameTemplate || fallbackKeyConfig.filenameTemplate,
          },
          publicBaseUrl,
          source: sources[i],
        });
        urls.push(res.url);
      }

      if (prefs.autoCopyUrl) {
        await Clipboard.copy(urls.join("\n"));
      }

      toast.style = Toast.Style.Success;
      toast.title = "Uploaded";
      toast.message = prefs.autoCopyUrl ? "URL copied to clipboard" : urls[urls.length - 1];
      await popToRoot({ clearSearchBar: true });
    } catch (err) {
      toast.style = Toast.Style.Failure;
      toast.title = "Upload failed";
      toast.message = err instanceof Error ? err.message : String(err);
    }
  }

  if (!initialValues) {
    return <Form isLoading navigationTitle={title} />;
  }

  return (
    <Form
      navigationTitle={title}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Upload" onSubmit={onSubmit} />
        </ActionPanel>
      }
      initialValues={initialValues}
    >
      <Form.Dropdown id="bucketId" title="Bucket" storeValue>
        {bucketOptions.map((b) => (
          <Form.Dropdown.Item key={b.id} value={b.id} title={b.label} />
        ))}
      </Form.Dropdown>

      <Form.Dropdown id="domainValue" title="Domain" storeValue>
        {domainOptions.map((d) => (
          <Form.Dropdown.Item key={d.id} value={d.value} title={d.label} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
