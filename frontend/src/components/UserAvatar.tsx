import { useEffect, useState } from "react";

export type AvatarUserFields = {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
};

const sizeClasses = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-xs",
  lg: "h-14 w-14 text-sm",
} as const;

function initials(u: AvatarUserFields): string {
  const d = u.displayName?.trim();
  if (d) {
    const parts = d.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (
        parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)
      ).toUpperCase();
    }
    return d.slice(0, 2).toUpperCase();
  }
  const un = u.username.trim();
  return (un.slice(0, 2) || "?").toUpperCase();
}

type Props = {
  user: AvatarUserFields | null | undefined;
  size?: keyof typeof sizeClasses;
  className?: string;
};

export function UserAvatar({ user, size = "md", className = "" }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const url = user?.avatarUrl?.trim();

  useEffect(() => {
    setImgFailed(false);
  }, [url]);

  const showImg = Boolean(url && !imgFailed);
  const label = user?.displayName?.trim() || user?.username || "User";

  return (
    <div
      role="img"
      aria-label={`Profile picture for ${label}`}
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-900/15 font-bold uppercase tracking-wide text-emerald-900 ring-2 ring-white/60 ${sizeClasses[size]} ${className}`}
    >
      {showImg && url ? (
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="select-none">{user ? initials(user) : "?"}</span>
      )}
    </div>
  );
}
