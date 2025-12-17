import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '../dialog'

describe('Dialog Components', () => {
  it('renders DialogFooter component without errors', () => {
    expect(() => render(
      <Dialog open>
        <DialogContent>
          <DialogFooter>Footer content</DialogFooter>
        </DialogContent>
      </Dialog>
    )).not.toThrow()
  })

  it('renders DialogFooter with className without errors', () => {
    expect(() => render(
      <Dialog open>
        <DialogContent>
          <DialogFooter className="custom-class">Footer</DialogFooter>
        </DialogContent>
      </Dialog>
    )).not.toThrow()
  })
})

