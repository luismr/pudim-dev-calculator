import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from '../sheet'

describe('Sheet Components', () => {
  it('renders Sheet component without errors', () => {
    expect(() => render(
      <Sheet open>
        <SheetContent>Content</SheetContent>
      </Sheet>
    )).not.toThrow()
  })

  it('renders SheetTrigger component without errors', () => {
    expect(() => render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
      </Sheet>
    )).not.toThrow()
  })

  it('renders SheetClose component without errors', () => {
    expect(() => render(
      <Sheet open>
        <SheetContent>
          <SheetClose>Close</SheetClose>
        </SheetContent>
      </Sheet>
    )).not.toThrow()
  })

  it('renders SheetContent component without errors', () => {
    expect(() => render(
      <Sheet open>
        <SheetContent>Content</SheetContent>
      </Sheet>
    )).not.toThrow()
  })

  it('renders SheetHeader component without errors', () => {
    expect(() => render(
      <Sheet open>
        <SheetContent>
          <SheetHeader>Header</SheetHeader>
        </SheetContent>
      </Sheet>
    )).not.toThrow()
  })

  it('renders SheetFooter component without errors', () => {
    expect(() => render(
      <Sheet open>
        <SheetContent>
          <SheetFooter>Footer</SheetFooter>
        </SheetContent>
      </Sheet>
    )).not.toThrow()
  })

  it('renders SheetTitle component without errors', () => {
    expect(() => render(
      <Sheet open>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Title</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )).not.toThrow()
  })

  it('renders SheetDescription component without errors', () => {
    expect(() => render(
      <Sheet open>
        <SheetContent>
          <SheetHeader>
            <SheetDescription>Description</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )).not.toThrow()
  })

  it('renders SheetContent with different side props', () => {
    expect(() => {
      render(<Sheet open><SheetContent side="right">Content</SheetContent></Sheet>)
      render(<Sheet open><SheetContent side="left">Content</SheetContent></Sheet>)
      render(<Sheet open><SheetContent side="top">Content</SheetContent></Sheet>)
      render(<Sheet open><SheetContent side="bottom">Content</SheetContent></Sheet>)
    }).not.toThrow()
  })
})

