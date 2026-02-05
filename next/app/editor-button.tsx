"use client";

export function EditorKeyBtn({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <button
      className="
        min-w-[44px] h-[44px]
        px-3 rounded-xl
        bg-neutral-800 text-white text-sm
        active:bg-neutral-600
        flex items-center justify-center
      "
      // ❗ IMPORTANT: NO touchstart, NO preventDefault
      onClick={onPress}
    >
      {label}
    </button>
  );
}
