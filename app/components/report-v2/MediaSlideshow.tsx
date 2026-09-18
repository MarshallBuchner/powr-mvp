"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

export type SlideshowSlide = {
  image: string;
  title: string;
  caption?: string;
};

type MediaSlideshowProps = {
  slides: SlideshowSlide[];
  label?: string;
  autoMs?: number;
  onSelect?: (slide: SlideshowSlide, index: number) => void;
};

export default function MediaSlideshow({
  slides,
  label = "Demo clips",
  autoMs = 3500,
  onSelect,
}: MediaSlideshowProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, autoMs);
    return () => window.clearInterval(id);
  }, [slides.length, autoMs]);

  if (!slides.length) return null;

  const slide = slides[index];

  return (
    <div className="rv2-slideshow" aria-roledescription="carousel" aria-label={label}>
      <button
        type="button"
        className="rv2-slideshow-frame"
        style={{ backgroundImage: `url(${slide.image})` }}
        onClick={() => onSelect?.(slide, index)}
        aria-label={`Open ${slide.title}`}
      >
        <span className="rv2-play is-lg">
          <Play size={20} />
        </span>
        <div className="rv2-slideshow-meta">
          <strong>{slide.title}</strong>
          {slide.caption ? <span>{slide.caption}</span> : null}
        </div>
      </button>
      <div className="rv2-slideshow-nav">
        <button
          type="button"
          className="rv2-control-btn"
          aria-label="Previous slide"
          onClick={() =>
            setIndex((current) => (current - 1 + slides.length) % slides.length)
          }
        >
          <ChevronLeft size={14} />
        </button>
        <div className="rv2-slideshow-dots" role="tablist" aria-label="Slides">
          {slides.map((item, i) => (
            <button
              key={`${item.title}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={i === index ? "is-active" : undefined}
              aria-label={`Show ${item.title}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
        <button
          type="button"
          className="rv2-control-btn"
          aria-label="Next slide"
          onClick={() => setIndex((current) => (current + 1) % slides.length)}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
