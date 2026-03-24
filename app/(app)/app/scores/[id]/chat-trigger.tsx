"use client";

interface Props {
  message:   string;
  children:  React.ReactNode;
  className?: string;
}

/**
 * Dispatches a custom event that the ChatPanel listens to.
 * Opens the panel and pre-fills the input with the given message.
 */
export function ChatTrigger({ message, children, className }: Props) {
  return (
    <button
      className={className}
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent("showsup:chat", { detail: { message } })
        )
      }
    >
      {children}
    </button>
  );
}
