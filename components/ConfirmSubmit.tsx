'use client'

export default function ConfirmSubmit({ label, message, className }: { label: string; message: string; className?: string }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault()
      }}
    >
      {label}
    </button>
  )
}
