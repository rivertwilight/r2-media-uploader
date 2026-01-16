import { Action, ActionPanel, Detail, Icon, openExtensionPreferences } from "@raycast/api";

export function ErrorView(props: { title: string; message: string }) {
  return (
    <Detail
      navigationTitle={props.title}
      markdown={`## ${props.title}\n\n${props.message}\n`}
      actions={
        <ActionPanel>
          <Action title="Open Extension Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
        </ActionPanel>
      }
    />
  );
}
