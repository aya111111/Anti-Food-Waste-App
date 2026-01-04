import React from "react";

type Props = {
  title: string;
  text?: string;
  url: string;
};

// A share button component that uses the Web Share API
export default function ShareButtons({ title, text, url }: Props) {
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {}
      return;
    }
    // fallback: open Twitter share (user can choose other buttons)
    const twitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      `${title} - ${text || ""} ${url}`
    )}`;
    window.open(twitter, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={share}
        className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold"
        title="Share"
      >
        Share
      </button>

      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
          `${title} ${url}`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700"
      >
        Twitter
      </a>

      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700"
      >
        Facebook
      </a>

      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs px-2 py-1 rounded bg-green-50 text-green-700"
      >
        WhatsApp
      </a>
    </div>
  );
}
