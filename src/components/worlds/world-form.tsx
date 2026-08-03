import type { FormEvent } from "react";

type WorldFormProps = {
  editing: boolean;
  disabled: boolean;
  name: string;
  prompt: string;
  onCancel: () => void;
  onNameChange: (value: string) => void;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
};

export function WorldForm({
  editing,
  disabled,
  name,
  prompt,
  onCancel,
  onNameChange,
  onPromptChange,
  onSubmit,
}: WorldFormProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="world-form" onSubmit={submit}>
      <header>
        <span aria-hidden="true">W-01</span>
        <div>
          <h2>{editing ? "修订世界档案" : "录入新世界"}</h2>
          <p>保存于当前浏览器，不会上传至服务器。</p>
        </div>
      </header>

      <label>
        <span>世界名称</span>
        <input
          aria-label="世界名称"
          autoComplete="off"
          maxLength={40}
          minLength={2}
          required
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </label>

      <label>
        <span>世界观描述</span>
        <textarea
          aria-label="世界观描述"
          maxLength={1200}
          minLength={20}
          required
          rows={11}
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
        />
        <small>{prompt.length} / 1200</small>
      </label>

      <div className="world-form__actions">
        <button type="submit" disabled={disabled}>
          {editing ? "更新世界观" : "保存世界观"}
        </button>
        {editing ? (
          <button type="button" className="world-form__cancel" onClick={onCancel}>
            取消修订
          </button>
        ) : null}
      </div>
    </form>
  );
}
