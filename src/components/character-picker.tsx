import { useState } from "react";
import {
  CHARACTERS,
  COLOURS,
  CharacterAvatar,
  type CharacterId,
  type ColourId,
} from "@/components/character-avatar";

/**
 * One-screen character + outfit colour picker shown before the mood stickers.
 * Fully skippable — the colour is a play choice, never a signal about the child.
 */
export function CharacterPicker({
  onDone,
  onSkip,
}: {
  onDone: (character: CharacterId, colour: ColourId) => void;
  onSkip: () => void;
}) {
  const [character, setCharacter] = useState<CharacterId | null>(null);
  const [colour, setColour] = useState<ColourId>("blue");

  return (
    <div className="card-soft mt-4 p-4 sm:p-6">
      <p className="text-center text-xl font-black">دوست امروزت را انتخاب کن!</p>
      <p className="text-balance-fa mt-1 text-center text-sm text-muted-foreground">
        یک شخصیت و یک رنگ لباس بردار.
      </p>

      <div className="mt-5 flex flex-wrap items-start justify-center gap-3">
        {CHARACTERS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCharacter(c.id)}
            aria-pressed={character === c.id}
            className="tap-bounce flex w-[76px] flex-col items-center gap-2 sm:w-[92px]"
          >
            <span
              className={`grid h-[76px] w-[76px] place-items-center rounded-full border-2 bg-secondary shadow-soft transition-colors sm:h-[92px] sm:w-[92px] ${
                character === c.id ? "border-primary bg-accent/30" : "border-border"
              }`}
            >
              <CharacterAvatar character={c.id} colour={colour} className="h-14 w-14 sm:h-16 sm:w-16" />
            </span>
            <span className="text-xs font-bold text-muted-foreground sm:text-sm">{c.name}</span>
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-lg font-black">رنگ لباس</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
        {COLOURS.map((col) => (
          <button
            key={col.id}
            type="button"
            onClick={() => setColour(col.id)}
            aria-label={col.name}
            aria-pressed={colour === col.id}
            className={`tap-bounce h-[60px] w-[60px] rounded-full border-4 shadow-soft ${
              colour === col.id ? "border-foreground" : "border-border"
            }`}
            style={{ backgroundColor: col.hex }}
          />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          disabled={!character}
          onClick={() => character && onDone(character, colour)}
          className="kid-target tap-bounce rounded-full bg-primary px-9 text-xl font-black text-primary-foreground disabled:opacity-50"
        >
          همینه! ✨
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="kid-target tap-bounce rounded-full border-2 border-border bg-card px-7 text-base font-black text-muted-foreground hover:bg-secondary"
        >
          بعداً
        </button>
      </div>
    </div>
  );
}
