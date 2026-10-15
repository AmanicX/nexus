import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: ReactNode
  bodyClassName?: string
}

const SIZES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-3xl',
  xl: 'sm:max-w-5xl',
}

export function Modal({
  open,
  onClose,
  children,
  title,
  subtitle,
  icon,
  size = 'md',
  footer,
  bodyClassName,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-black/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, transform: 'translateY(40px) scale(0.99)' }}
            animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
            exit={{ opacity: 0, transform: 'translateY(30px) scale(0.99)' }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            className={cn(
              'panel-solid relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-4xl shadow-2xl will-change-transform sm:my-auto sm:max-h-[88vh] sm:rounded-4xl',
              SIZES[size],
            )}
          >
            <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
              <span className="h-1.5 w-9 rounded-full bg-border-strong" />
            </div>

            {(title || icon) && (
              <div className="flex items-start gap-3 border-b border-border px-5 py-4 sm:px-6">
                {icon && (
                  <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-grad text-accent-fg shadow-lg">
                    {icon}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  {title && (
                    <h2 className="font-display text-lg leading-tight font-semibold tracking-tight">
                      {title}
                    </h2>
                  )}
                  {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="btn btn-ghost -mr-1.5 -mt-1 size-9 shrink-0 rounded-full p-0"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <div
              className={cn(
                'scroll-thin flex-1 overflow-y-auto px-5 py-5 sm:px-6',
                bodyClassName,
              )}
            >
              {children}
            </div>

            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-3.5">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
