import { MemoryRouter, MemoryRouterProps } from 'react-router-dom'

const FUTURE_FLAGS = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const

export function TestRouter({ children, ...props }: MemoryRouterProps) {
  return (
    <MemoryRouter future={FUTURE_FLAGS} {...props}>
      {children}
    </MemoryRouter>
  )
}
