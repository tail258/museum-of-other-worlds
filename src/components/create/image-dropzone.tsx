type ImageDropzoneProps = {
  file: File | null;
  previewUrl: string | null;
  onSelect: (file: File) => void;
};

export function ImageDropzone({ file, previewUrl, onSelect }: ImageDropzoneProps) {
  return (
    <div className="image-dropzone">
      <label htmlFor="artifact-image" className="image-dropzone__label">
        <span className="field-index" aria-hidden="true">03</span>
        <strong>上传现实物品照片</strong>
      </label>
      <small id="artifact-image-help" className="field-help">JPEG、PNG 或 WebP，最大 8 MiB</small>
      <input
        id="artifact-image"
        name="artifact-image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="上传现实物品照片"
        aria-describedby="artifact-image-help"
        onChange={(event) => {
          const selected = event.currentTarget.files?.[0];
          if (selected) onSelect(selected);
        }}
      />
      <div className="image-dropzone__surface">
        {previewUrl ? (
          <>
            {/* Local blob previews are intentionally not sent through next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="待鉴定物品预览" />
            <span>{file?.name}</span>
          </>
        ) : (
          <>
            <span className="image-dropzone__mark" aria-hidden="true" />
            <span>将物品置入鉴定台</span>
          </>
        )}
      </div>
    </div>
  );
}
