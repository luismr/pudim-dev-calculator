import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '../dialog'
import { VisuallyHidden } from '../visually-hidden'

describe('Dialog Components', () => {
  it('renders DialogFooter component without errors', () => {
    expect(() => render(
      <Dialog open>
        <DialogContent>
          <VisuallyHidden>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>Test dialog description</DialogDescription>
          </VisuallyHidden>
          <DialogFooter>Footer content</DialogFooter>
        </DialogContent>
      </Dialog>
    )).not.toThrow()
  })

  it('renders DialogFooter with className without errors', () => {
    expect(() => render(
      <Dialog open>
        <DialogContent>
          <VisuallyHidden>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>Test dialog description</DialogDescription>
          </VisuallyHidden>
          <DialogFooter className="custom-class">Footer</DialogFooter>
        </DialogContent>
      </Dialog>
    )).not.toThrow()
  })
})

