export const inputCls = (err?: string) =>
  `w-full border bg-chalk px-3.5 py-3 text-[15px] outline-none transition placeholder:text-graphite/60 focus:border-ink focus:ring-1 focus:ring-ink ${err ? 'border-[#B3261E]' : 'border-ink/20'}`

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const PHONE_RE = /^[+()\-.\s\d]{7,20}$/

export const aria = (id: string, err?: string, hint?: boolean) => ({
  id,
  'aria-invalid': err ? true : undefined,
  'aria-describedby': err ? `${id}-err` : hint ? `${id}-hint` : undefined,
})
