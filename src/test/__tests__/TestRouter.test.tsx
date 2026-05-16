import { render, screen } from '@testing-library/react'
import { Routes, Route } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { TestRouter } from '../router'

describe('TestRouter', () => {
  it('renders children', () => {
    render(
      <TestRouter>
        <div>hello</div>
      </TestRouter>,
    )
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('supports initialEntries', () => {
    render(
      <TestRouter initialEntries={['/test']}>
        <Routes>
          <Route path="/test" element={<div>test route</div>} />
        </Routes>
      </TestRouter>,
    )
    expect(screen.getByText('test route')).toBeInTheDocument()
  })

  it('provides working link navigation', () => {
    render(
      <TestRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<div>home</div>} />
          <Route path="/other" element={<div>other</div>} />
        </Routes>
      </TestRouter>,
    )
    expect(screen.getByText('home')).toBeInTheDocument()
  })
})
