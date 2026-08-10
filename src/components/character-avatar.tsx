/**
 * Original, non-licensed friendly characters drawn as simple inline SVGs.
 * The `colour` prop only tints the outfit — it carries no meaning beyond that.
 */

export type CharacterId = "mahtab" | "arash" | "niloo" | "tooti";

export const CHARACTERS: { id: CharacterId; name: string }[] = [
  { id: "mahtab", name: "مهتاب" },
  { id: "arash", name: "آرش" },
  { id: "niloo", name: "نیلو" },
  { id: "tooti", name: "توتی" },
];

export type ColourId = "blue" | "green" | "orange" | "purple" | "pink" | "yellow";

export const COLOURS: { id: ColourId; name: string; hex: string }[] = [
  { id: "blue", name: "آبی", hex: "#3B82F6" },
  { id: "green", name: "سبز", hex: "#22C55E" },
  { id: "orange", name: "نارنجی", hex: "#F97316" },
  { id: "purple", name: "بنفش", hex: "#A855F7" },
  { id: "pink", name: "صورتی", hex: "#EC4899" },
  { id: "yellow", name: "زرد", hex: "#FACC15" },
];

export function characterName(id: string | null | undefined) {
  return CHARACTERS.find((c) => c.id === id)?.name ?? null;
}

export function colourName(id: string | null | undefined) {
  return COLOURS.find((c) => c.id === id)?.name ?? null;
}

export function colourHex(id: string | null | undefined) {
  return COLOURS.find((c) => c.id === id)?.hex ?? "#3B82F6";
}

export function CharacterAvatar({
  character,
  colour,
  className = "h-16 w-16",
  title,
}: {
  character: CharacterId;
  colour?: string | null;
  className?: string;
  title?: string;
}) {
  const c = colourHex(colour);
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={title ?? ""}>
      {title ? <title>{title}</title> : null}
      {character === "mahtab" ? (
        <g>
          <path d="M22 92c0-16 12-26 28-26s28 10 28 26z" fill={c} />
          <circle cx="50" cy="42" r="24" fill="#F7D9BE" />
          <path d="M26 40a24 24 0 0 1 48 0c0-18-10-26-24-26S26 22 26 40z" fill="#4B3A2F" />
          <circle cx="41" cy="43" r="3.2" fill="#3A2A22" />
          <circle cx="59" cy="43" r="3.2" fill="#3A2A22" />
          <path d="M43 53q7 6 14 0" stroke="#3A2A22" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="33" cy="50" r="3.5" fill="#F5A3A3" opacity=".7" />
          <circle cx="67" cy="50" r="3.5" fill="#F5A3A3" opacity=".7" />
          <path d="M72 20l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill="#FACC15" />
        </g>
      ) : null}
      {character === "arash" ? (
        <g>
          <path d="M22 92c0-16 12-26 28-26s28 10 28 26z" fill={c} />
          <path d="M28 26l6 12M72 26l-6 12" stroke="#C2703C" strokeWidth="10" strokeLinecap="round" />
          <circle cx="50" cy="44" r="23" fill="#E9955A" />
          <path d="M32 52a18 18 0 0 0 36 0z" fill="#FDEBD8" />
          <circle cx="42" cy="42" r="3.2" fill="#3A2A22" />
          <circle cx="58" cy="42" r="3.2" fill="#3A2A22" />
          <circle cx="50" cy="53" r="3.4" fill="#3A2A22" />
          <path d="M44 60q6 5 12 0" stroke="#3A2A22" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </g>
      ) : null}
      {character === "niloo" ? (
        <g>
          <path d="M22 92c0-16 12-26 28-26s28 10 28 26z" fill={c} />
          <path d="M38 22c0-10 3-14 5-14s5 4 5 14zM52 22c0-10 3-14 5-14s5 4 5 14z" fill="#F3E4E8" stroke="#D9C3C9" strokeWidth="2" />
          <circle cx="50" cy="44" r="22" fill="#F7EDF0" />
          <circle cx="42" cy="42" r="3.2" fill="#3A2A22" />
          <circle cx="58" cy="42" r="3.2" fill="#3A2A22" />
          <path d="M50 50l-4 3h8z" fill="#E58FA5" />
          <path d="M46 56q4 4 8 0" stroke="#3A2A22" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <circle cx="34" cy="50" r="3.5" fill="#F5A3A3" opacity=".7" />
          <circle cx="66" cy="50" r="3.5" fill="#F5A3A3" opacity=".7" />
        </g>
      ) : null}
      {character === "tooti" ? (
        <g>
          <ellipse cx="50" cy="70" rx="26" ry="24" fill={c} />
          <circle cx="50" cy="40" r="21" fill="#7DD3A0" />
          <path d="M44 16q6-10 12 0z" fill="#FACC15" />
          <circle cx="43" cy="38" r="3.2" fill="#22302A" />
          <circle cx="57" cy="38" r="3.2" fill="#22302A" />
          <path d="M50 45l-6 5 6 5 3-5z" fill="#F59E0B" />
          <path d="M26 66q-10 8-4 16 8 2 12-8z" fill="#7DD3A0" />
        </g>
      ) : null}
    </svg>
  );
}
