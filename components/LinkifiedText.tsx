import { Fragment } from "react";

const URL_RE = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

// Renders plain text with URLs turned into clickable links (trainer notes
// often contain YouTube / Drive links).
export default function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (!part.match(URL_RE)) return <Fragment key={i}>{part}</Fragment>;
        const trimmed = part.replace(/[).,;!?]+$/, "");
        const trailing = part.slice(trimmed.length);
        const href = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
        return (
          <Fragment key={i}>
            <a href={href} target="_blank" rel="noopener noreferrer"
              className="underline font-semibold not-italic" style={{ color: "var(--accent-light)", overflowWrap: "anywhere" }}>
              {trimmed}
            </a>
            {trailing}
          </Fragment>
        );
      })}
    </>
  );
}
