export function CharLineBlock({ ch }: { ch: string }) {
  return (
    <div className="text-[11px] leading-relaxed overflow-hidden whitespace-nowrap text-center"
      style={{ fontFamily: "'Courier New', Courier, monospace" }}>
      {ch.repeat(200)}
    </div>
  );
}
