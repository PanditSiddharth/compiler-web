type KeyBtnProps = {
  label: string;
  send: () => void;
};
const MOVE_THRESHOLD = 10; // px

export const KeyBtn = ({ label, send }: KeyBtnProps) => {
  let startX = 0;
  let startY = 0;
  let moved = false;

  const onStart = (e: any) => {
    e.preventDefault();
    const t = e.touches?.[0];
    if (!t) return;

    startX = t.clientX;
    startY = t.clientY;
    moved = false;
  };

  const onMove = (e: any) => {
    const t = e.touches?.[0];
    if (!t) return;

    const dx = Math.abs(t.clientX - startX);
    const dy = Math.abs(t.clientY - startY);

    if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
      moved = true; // 👈 scrolling
    }
  };

  const onEnd = (e: any) => {
    e.preventDefault();
    if (!moved) {
      send(); // ✅ real tap
    }
  };

  const onMouseDown = (e: any) => {
    e.preventDefault();
    send(); // desktop ke liye
  };

  return (
    <button
      className="
        min-w-[44px] h-[44px]
        px-3 rounded-xl
        bg-neutral-800 text-white text-sm
        active:bg-neutral-600
        flex items-center justify-center
        select-none
      "
      onTouchStart={onStart}
      onTouchMove={onMove}
      onTouchEnd={onEnd}
      onMouseDown={onMouseDown}
    >
      {label}
    </button>
  );
};