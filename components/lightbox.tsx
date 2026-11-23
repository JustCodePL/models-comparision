"use client";

import { useCallback, useEffect, useState } from "react";

type Item = { src: string; caption: string };

/** Opens any <a data-lightbox> on the page in a full-screen viewer; arrows move between them, Esc closes. */
export function Lightbox() {
  const [items, setItems] = useState<Item[]>([]);
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[data-lightbox]");
      if (!link) return;
      event.preventDefault();
      const links = [...document.querySelectorAll<HTMLAnchorElement>("a[data-lightbox]")];
      setItems(links.map((a) => ({ src: a.href, caption: a.dataset.caption ?? "" })));
      setIndex(links.indexOf(link));
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const close = useCallback(() => setIndex(null), []);
  const step = useCallback((delta: number) => setIndex((i) => (i === null ? i : (i + delta + items.length) % items.length)), [items.length]);

  useEffect(() => {
    if (index === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, close, step]);

  if (index === null || !items[index]) return null;
  const item = items[index];
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Podgląd zdjęcia" onClick={close}>
      <figure onClick={(event) => event.stopPropagation()}>
        <img src={item.src} alt={item.caption} />
        <figcaption>{item.caption}<span>{index + 1} / {items.length}</span></figcaption>
      </figure>
      {items.length > 1 && (
        <>
          <button type="button" className="lightbox-prev" aria-label="Poprzednie" onClick={(event) => { event.stopPropagation(); step(-1); }}>‹</button>
          <button type="button" className="lightbox-next" aria-label="Następne" onClick={(event) => { event.stopPropagation(); step(1); }}>›</button>
        </>
      )}
      <button type="button" className="lightbox-close" aria-label="Zamknij" onClick={close}>×</button>
    </div>
  );
}
