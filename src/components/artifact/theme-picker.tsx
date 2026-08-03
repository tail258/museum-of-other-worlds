import type { ArtifactTheme } from "@/features/artifacts/artifact-types";

export const ARTIFACT_THEMES: ReadonlyArray<{
  id: ArtifactTheme;
  label: string;
  code: string;
}> = [
  { id: "dark-fantasy", label: "黑暗幻想", code: "DF" },
  { id: "retro-sci-fi", label: "复古科幻", code: "RS" },
  { id: "wasteland-archive", label: "废土档案", code: "WA" },
];

type ThemePickerProps = {
  value: ArtifactTheme;
  onChange: (theme: ArtifactTheme) => void;
  compact?: boolean;
};

export function ThemePicker({ value, onChange, compact = false }: ThemePickerProps) {
  return (
    <div className={compact ? "theme-picker theme-picker--compact" : "theme-picker"} aria-label="视觉主题">
      {ARTIFACT_THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          aria-pressed={value === theme.id}
          onClick={() => onChange(theme.id)}
        >
          <span aria-hidden="true">{theme.code}</span>
          {theme.label}
        </button>
      ))}
    </div>
  );
}
