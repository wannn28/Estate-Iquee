import { useEffect } from 'react'

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} — Hollis Row (demo)` : 'Hollis Row — Austin homes for sale & rent (demo)'
  }, [title])
}
