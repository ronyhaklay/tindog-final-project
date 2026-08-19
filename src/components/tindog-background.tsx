export function TinDogBackground() {
  const decorations = [
    ["🐾", "left-[3%] top-[4%] -rotate-12 text-4xl opacity-[0.13]"],
    ["🐶", "left-[13%] top-[10%] rotate-12 text-3xl opacity-[0.14]"],
    ["🐕", "left-[27%] top-[5%] -rotate-6 text-3xl opacity-[0.11]"],
    ["🐾", "left-[41%] top-[12%] rotate-12 text-5xl opacity-[0.12]"],
    ["🐶", "right-[38%] top-[5%] -rotate-12 text-3xl opacity-[0.13]"],
    ["🐾", "right-[22%] top-[11%] rotate-6 text-4xl opacity-[0.13]"],
    ["🐕", "right-[7%] top-[6%] rotate-12 text-3xl opacity-[0.12]"],

    ["🐶", "left-[6%] top-[22%] rotate-6 text-3xl opacity-[0.13]"],
    ["🐾", "left-[20%] top-[27%] -rotate-12 text-5xl opacity-[0.12]"],
    ["🐕", "left-[35%] top-[20%] rotate-12 text-3xl opacity-[0.11]"],
    ["🐾", "left-[50%] top-[29%] -rotate-6 text-4xl opacity-[0.13]"],
    ["🐶", "right-[30%] top-[22%] rotate-12 text-3xl opacity-[0.14]"],
    ["🐾", "right-[15%] top-[29%] -rotate-12 text-5xl opacity-[0.12]"],
    ["🐕", "right-[3%] top-[21%] rotate-6 text-3xl opacity-[0.12]"],

    ["🐾", "left-[2%] top-[39%] rotate-12 text-5xl opacity-[0.12]"],
    ["🐕", "left-[16%] top-[45%] -rotate-6 text-3xl opacity-[0.12]"],
    ["🐶", "left-[31%] top-[37%] -rotate-12 text-3xl opacity-[0.14]"],
    ["🐾", "left-[46%] top-[48%] rotate-6 text-4xl opacity-[0.13]"],
    ["🐕", "right-[35%] top-[39%] rotate-12 text-3xl opacity-[0.11]"],
    ["🐾", "right-[20%] top-[46%] -rotate-12 text-5xl opacity-[0.12]"],
    ["🐶", "right-[5%] top-[37%] rotate-6 text-3xl opacity-[0.14]"],

    ["🐶", "left-[7%] top-[58%] -rotate-12 text-3xl opacity-[0.14]"],
    ["🐾", "left-[22%] top-[64%] rotate-12 text-5xl opacity-[0.12]"],
    ["🐕", "left-[37%] top-[56%] rotate-6 text-3xl opacity-[0.11]"],
    ["🐾", "left-[52%] top-[66%] -rotate-12 text-4xl opacity-[0.13]"],
    ["🐶", "right-[28%] top-[57%] rotate-12 text-3xl opacity-[0.14]"],
    ["🐾", "right-[12%] top-[65%] -rotate-6 text-5xl opacity-[0.12]"],
    ["🐕", "right-[2%] top-[56%] rotate-12 text-3xl opacity-[0.12]"],

    ["🐾", "left-[3%] top-[76%] -rotate-6 text-5xl opacity-[0.12]"],
    ["🐶", "left-[18%] top-[84%] rotate-12 text-3xl opacity-[0.14]"],
    ["🐕", "left-[34%] top-[75%] -rotate-12 text-3xl opacity-[0.11]"],
    ["🐾", "left-[49%] top-[87%] rotate-6 text-4xl opacity-[0.13]"],
    ["🐶", "right-[34%] top-[77%] -rotate-12 text-3xl opacity-[0.14]"],
    ["🐾", "right-[18%] top-[86%] rotate-12 text-5xl opacity-[0.12]"],
    ["🐕", "right-[4%] top-[75%] -rotate-6 text-3xl opacity-[0.12]"],

    ["🐾", "left-[10%] bottom-[2%] rotate-12 text-4xl opacity-[0.12]"],
    ["🐶", "left-[42%] bottom-[3%] -rotate-12 text-3xl opacity-[0.14]"],
    ["🐕", "right-[28%] bottom-[2%] rotate-6 text-3xl opacity-[0.11]"],
    ["🐾", "right-[7%] bottom-[4%] -rotate-12 text-4xl opacity-[0.13]"],
  ] as const;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 7% 17%, rgba(255,205,222,.50) 0, rgba(255,205,222,.23) 19rem, transparent 35rem), radial-gradient(circle at 92% 86%, rgba(255,232,177,.50) 0, rgba(255,232,177,.24) 20rem, transparent 37rem), linear-gradient(135deg,#fff9fb 0%,#fffaf6 47%,#fffef8 100%)",
        }}
      />
      {decorations.map(([emoji, classes], index) => (
        <span key={index} className={`absolute ${classes}`}>
          {emoji}
        </span>
      ))}
    </div>
  );
}
