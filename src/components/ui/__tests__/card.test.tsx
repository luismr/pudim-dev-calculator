import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from '../card'

describe('Card Components', () => {
  it('renders Card component', () => {
    const { container } = render(<Card>Test content</Card>)
    expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument()
  })

  it('renders CardHeader component', () => {
    const { container } = render(<CardHeader>Header</CardHeader>)
    expect(container.querySelector('[data-slot="card-header"]')).toBeInTheDocument()
  })

  it('renders CardTitle component', () => {
    const { container } = render(<CardTitle>Title</CardTitle>)
    expect(container.querySelector('[data-slot="card-title"]')).toBeInTheDocument()
  })

  it('renders CardDescription component', () => {
    const { container } = render(<CardDescription>Description</CardDescription>)
    expect(container.querySelector('[data-slot="card-description"]')).toBeInTheDocument()
  })

  it('renders CardContent component', () => {
    const { container } = render(<CardContent>Content</CardContent>)
    expect(container.querySelector('[data-slot="card-content"]')).toBeInTheDocument()
  })

  it('renders CardFooter component', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>)
    expect(container.querySelector('[data-slot="card-footer"]')).toBeInTheDocument()
  })

  it('renders CardAction component', () => {
    const { container } = render(<CardAction>Action</CardAction>)
    expect(container.querySelector('[data-slot="card-action"]')).toBeInTheDocument()
  })
})

