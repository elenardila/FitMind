import { useEffect, useRef } from 'react'

export default function Modal({ open, onClose, title, children, actions }) {
    const ref = useRef(null)

    useEffect(() => {
        if (!open) return
        const onKey = (e) => e.key === 'Escape' && onClose?.()
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    useEffect(() => {
        if (open && ref.current) {
            // enfocar el primer botón del modal
            const btn = ref.current.querySelector('button, a, [tabindex]:not([tabindex="-1"])')
            btn?.focus()
        }
    }, [open])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[100] grid place-items-center p-4"
            aria-modal="true"
            role="dialog"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                ref={ref}
                className="relative w-full max-w-md rounded-xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 shadow-xl p-6 animate-[fadeIn_.15s_ease-out]"
                onClick={(e) => e.stopPropagation()}
            >
                {title && <h3 className="text-lg font-semibold">{title}</h3>}
                <div className="mt-3 text-sm text-text-muted dark:text-white/80">
                    {children}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    {actions}
                </div>
            </div>
        </div>
    )
}
