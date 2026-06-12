import { useEffect, useState } from 'react';
import { Droppable, DroppableProps } from '@hello-pangea/dnd';

// Wrapper for Droppable that works with React StrictMode
export function StrictModeDroppable({ children, ...props }: DroppableProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  if (!enabled) return null;

  return <Droppable {...props}>{children}</Droppable>;
}
