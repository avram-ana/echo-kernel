const EMPTY_STAR = "rgb(190, 242, 100)";

export function StarInput({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex gap-1 ${disabled ? "pointer-events-none opacity-70" : ""}`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            className="text-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 data-[filled=true]:text-amber-400 data-[filled=true]:drop-shadow-sm"
            style={{ color: filled ? undefined : EMPTY_STAR }}
            data-filled={filled}
            aria-label={`${n} stars`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
