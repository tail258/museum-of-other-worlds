import type { Worldview } from "@/features/worlds/world-schema";

type WorldListProps = {
  worlds: Worldview[];
  onEdit: (world: Worldview) => void;
  onRemove: (world: Worldview) => void;
};

export function WorldList({ worlds, onEdit, onRemove }: WorldListProps) {
  if (worlds.length === 0) {
    return (
      <div className="world-list__empty">
        <span aria-hidden="true">∅</span>
        <p>尚未保存世界观。建立第一份世界档案后，可在鉴定台直接调用。</p>
      </div>
    );
  }

  return (
    <ol className="world-list">
      {worlds.map((world, index) => (
        <li key={world.id}>
          <div className="world-list__index" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </div>
          <article>
            <header>
              <h3>{world.name}</h3>
              <time dateTime={world.updatedAt}>
                {new Intl.DateTimeFormat("zh-CN", {
                  month: "2-digit",
                  day: "2-digit",
                }).format(new Date(world.updatedAt))}
              </time>
            </header>
            <p>{world.prompt}</p>
            <div>
              <button type="button" onClick={() => onEdit(world)} aria-label={`编辑 ${world.name}`}>
                编辑
              </button>
              <button type="button" onClick={() => onRemove(world)} aria-label={`删除 ${world.name}`}>
                删除
              </button>
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}
