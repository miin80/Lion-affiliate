import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * DragSortable — wrapper drag-drop dùng @dnd-kit.
 *
 * Props:
 *  - items: mảng items (mỗi item có `.id`)
 *  - onReorder(newItems): callback nhận mảng sau khi sắp xếp lại
 *  - layout: 'vertical' | 'grid' (default vertical)
 *  - renderItem(item, dragHandleProps): function render item
 */
export default function DragSortable({ items, onReorder, layout = 'vertical', renderItem }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((it) => it.id === active.id);
    const newIndex = items.findIndex((it) => it.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    onReorder?.(next);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={items.map((it) => it.id)}
        strategy={layout === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
      >
        {items.map((item) => (
          <SortableItem key={item.id} id={item.id}>
            {(dragProps) => renderItem(item, dragProps)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

/** Drag handle button — bind dragProps lên span/div này để chỉ phần đó draggable. */
export function DragHandle({ dragProps, className = '' }) {
  return (
    <button
      type="button"
      {...dragProps}
      aria-label="Kéo để sắp xếp"
      className={`flex h-7 w-7 cursor-grab touch-none items-center justify-center rounded-md bg-brand-ink-100 text-brand-ink-500 hover:bg-brand-ink-200 active:cursor-grabbing ${className}`}
      title="Kéo để sắp xếp"
    >
      ⋮⋮
    </button>
  );
}
