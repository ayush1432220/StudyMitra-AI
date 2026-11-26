/**
 * StudyMitra AI logo mark: an open book with an AI spark above it.
 * Uses currentColor so it inherits the surrounding text color.
 */
export default function Logo({ size = 18, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="StudyMitra AI"
      role="img"
      {...props}
    >
      <path d="M12 20c-2.2-1.4-4.8-2-8-2V8.5c3.2 0 5.8.6 8 2 2.2-1.4 4.8-2 8-2V18c-3.2 0-5.8.6-8 2Z" />
      <path d="M12 10.5V20" />
      <path
        d="M12 2.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9Z"
        fill="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}
