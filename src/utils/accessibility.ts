'use client'

// Comprehensive Accessibility Enhancement System
interface AccessibilityOptions {
  announcePageChanges?: boolean
  keyboardNavigation?: boolean
  focusManagement?: boolean
  colorContrastCheck?: boolean
  reducedMotion?: boolean
  screenReaderOptimizations?: boolean
}

class AccessibilityManager {
  private options: AccessibilityOptions
  private announcer: HTMLElement | null = null
  private focusHistory: HTMLElement[] = []
  private keyboardNavigationEnabled = true

  constructor(options: AccessibilityOptions = {}) {
    this.options = {
      announcePageChanges: true,
      keyboardNavigation: true,
      focusManagement: true,
      colorContrastCheck: true,
      reducedMotion: true,
      screenReaderOptimizations: true,
      ...options
    }

    this.initialize()
  }

  private initialize() {
    if (typeof window === 'undefined') return

    this.createScreenReaderAnnouncer()
    this.setupKeyboardNavigation()
    this.setupFocusManagement()
    this.setupReducedMotionSupport()
    this.enhanceFormAccessibility()
    this.setupSkipLinks()
  }

  private createScreenReaderAnnouncer() {
    if (!this.options.screenReaderOptimizations) return

    this.announcer = document.createElement('div')
    this.announcer.setAttribute('aria-live', 'polite')
    this.announcer.setAttribute('aria-atomic', 'true')
    this.announcer.className = 'sr-only'
    this.announcer.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `
    document.body.appendChild(this.announcer)
  }

  private setupKeyboardNavigation() {
    if (!this.options.keyboardNavigation) return

    document.addEventListener('keydown', (event) => {
      // Tab navigation enhancement
      if (event.key === 'Tab') {
        this.handleTabNavigation(event)
      }

      // Escape key handling
      if (event.key === 'Escape') {
        this.handleEscapeKey(event)
      }

      // Arrow key navigation for custom components
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        this.handleArrowNavigation(event)
      }

      // Enter and Space for custom interactive elements
      if (event.key === 'Enter' || event.key === ' ') {
        this.handleActivation(event)
      }
    })

    // Show focus indicators when navigating with keyboard
    document.addEventListener('keydown', () => {
      document.body.classList.add('keyboard-navigation')
    })

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation')
    })
  }

  private handleTabNavigation(event: KeyboardEvent) {
    const focusableElements = this.getFocusableElements()
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)

    // Trap focus within modals
    const modal = document.querySelector('[role="dialog"]:not([aria-hidden="true"])')
    if (modal) {
      const modalFocusable = this.getFocusableElements(modal as HTMLElement)
      const firstFocusable = modalFocusable[0]
      const lastFocusable = modalFocusable[modalFocusable.length - 1]

      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault()
        lastFocusable?.focus()
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault()
        firstFocusable?.focus()
      }
    }
  }

  private handleEscapeKey(event: KeyboardEvent) {
    // Close modals/dropdowns
    const modal = document.querySelector('[role="dialog"]:not([aria-hidden="true"])')
    if (modal) {
      const closeButton = modal.querySelector('[data-close-modal]') as HTMLElement
      closeButton?.click()
      return
    }

    // Close dropdowns
    const dropdown = document.querySelector('[role="menu"]:not([aria-hidden="true"])')
    if (dropdown) {
      const trigger = document.querySelector(`[aria-controls="${dropdown.id}"]`) as HTMLElement
      trigger?.click()
      trigger?.focus()
      return
    }

    // Return focus to previous element
    this.restoreFocus()
  }

  private handleArrowNavigation(event: KeyboardEvent) {
    const target = event.target as HTMLElement
    
    // Handle tab panels
    if (target.getAttribute('role') === 'tab') {
      this.handleTabListNavigation(event)
      return
    }

    // Handle menu navigation
    if (target.closest('[role="menu"]')) {
      this.handleMenuNavigation(event)
      return
    }

    // Handle listbox navigation
    if (target.closest('[role="listbox"]')) {
      this.handleListboxNavigation(event)
      return
    }
  }

  private handleTabListNavigation(event: KeyboardEvent) {
    const tabList = (event.target as HTMLElement).closest('[role="tablist"]')
    if (!tabList) return

    const tabs = Array.from(tabList.querySelectorAll('[role="tab"]')) as HTMLElement[]
    const currentIndex = tabs.indexOf(event.target as HTMLElement)

    let nextIndex = currentIndex
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0
    }

    if (nextIndex !== currentIndex) {
      event.preventDefault()
      tabs[nextIndex].focus()
      tabs[nextIndex].click()
    }
  }

  private handleMenuNavigation(event: KeyboardEvent) {
    const menu = (event.target as HTMLElement).closest('[role="menu"]')
    if (!menu) return

    const items = Array.from(menu.querySelectorAll('[role="menuitem"]')) as HTMLElement[]
    const currentIndex = items.indexOf(event.target as HTMLElement)

    let nextIndex = currentIndex
    if (event.key === 'ArrowUp') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
    } else if (event.key === 'ArrowDown') {
      nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
    }

    if (nextIndex !== currentIndex) {
      event.preventDefault()
      items[nextIndex].focus()
    }
  }

  private handleListboxNavigation(event: KeyboardEvent) {
    const listbox = (event.target as HTMLElement).closest('[role="listbox"]')
    if (!listbox) return

    const options = Array.from(listbox.querySelectorAll('[role="option"]')) as HTMLElement[]
    const currentIndex = options.findIndex(option => option.getAttribute('aria-selected') === 'true')

    let nextIndex = currentIndex
    if (event.key === 'ArrowUp') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1
    } else if (event.key === 'ArrowDown') {
      nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0
    }

    if (nextIndex !== currentIndex) {
      event.preventDefault()
      
      // Update selection
      options[currentIndex]?.setAttribute('aria-selected', 'false')
      options[nextIndex]?.setAttribute('aria-selected', 'true')
      options[nextIndex]?.focus()
      
      // Announce selection
      this.announce(`${options[nextIndex]?.textContent} selected`)
    }
  }

  private handleActivation(event: KeyboardEvent) {
    const target = event.target as HTMLElement
    
    // Handle custom interactive elements
    if (target.getAttribute('role') === 'button' && !(target as any).disabled) {
      event.preventDefault()
      target.click()
    }

    // Handle tab activation
    if (target.getAttribute('role') === 'tab') {
      event.preventDefault()
      target.click()
    }

    // Handle menu item activation
    if (target.getAttribute('role') === 'menuitem') {
      event.preventDefault()
      target.click()
    }
  }

  private setupFocusManagement() {
    if (!this.options.focusManagement) return

    // Track focus changes
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement
      if (target && target !== document.body) {
        this.focusHistory.push(target)
        
        // Limit history size
        if (this.focusHistory.length > 10) {
          this.focusHistory.shift()
        }
      }
    })
  }

  private setupReducedMotionSupport() {
    if (!this.options.reducedMotion) return

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      document.documentElement.style.setProperty('--animation-duration', '0.01ms')
      document.documentElement.style.setProperty('--transition-duration', '0.01ms')
      document.body.classList.add('reduce-motion')
    }

    // Listen for changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      if (e.matches) {
        document.documentElement.style.setProperty('--animation-duration', '0.01ms')
        document.documentElement.style.setProperty('--transition-duration', '0.01ms')
        document.body.classList.add('reduce-motion')
      } else {
        document.documentElement.style.removeProperty('--animation-duration')
        document.documentElement.style.removeProperty('--transition-duration')
        document.body.classList.remove('reduce-motion')
      }
    })
  }

  private enhanceFormAccessibility() {
    // Auto-enhance forms
    document.addEventListener('DOMContentLoaded', () => {
      this.enhanceAllForms()
    })

    // Enhance dynamically added forms
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement
            const forms = element.querySelectorAll('form')
            forms.forEach(form => this.enhanceForm(form))
          }
        })
      })
    })

    observer.observe(document.body, { childList: true, subtree: true })
  }

  private enhanceAllForms() {
    document.querySelectorAll('form').forEach(form => this.enhanceForm(form))
  }

  private enhanceForm(form: HTMLFormElement) {
    // Add form validation announcements
    form.addEventListener('submit', (event) => {
      const invalidFields = form.querySelectorAll(':invalid')
      if (invalidFields.length > 0) {
        event.preventDefault()
        this.announce(`Form has ${invalidFields.length} error${invalidFields.length > 1 ? 's' : ''}. Please review and correct.`)
        
        // Focus first invalid field
        const firstInvalid = invalidFields[0] as HTMLElement
        firstInvalid.focus()
      }
    })

    // Enhance input fields
    form.querySelectorAll('input, textarea, select').forEach(field => {
      this.enhanceFormField(field as HTMLInputElement)
    })
  }

  private enhanceFormField(field: HTMLInputElement) {
    // Add live validation feedback
    field.addEventListener('blur', () => {
      if (field.validity.valid) {
        this.announce(`${this.getFieldLabel(field)} is valid`)
      } else {
        this.announce(`${this.getFieldLabel(field)} has an error: ${field.validationMessage}`)
      }
    })

    // Add required field indicators
    if (field.required && !field.getAttribute('aria-required')) {
      field.setAttribute('aria-required', 'true')
    }

    // Link labels and error messages
    const label = this.getFieldLabel(field)
    if (label && !field.getAttribute('aria-label') && !field.getAttribute('aria-labelledby')) {
      const labelElement = document.querySelector(`label[for="${field.id}"]`)
      if (labelElement && !labelElement.id) {
        labelElement.id = `label-${field.id}`
        field.setAttribute('aria-labelledby', labelElement.id)
      }
    }
  }

  private getFieldLabel(field: HTMLInputElement): string {
    const label = document.querySelector(`label[for="${field.id}"]`)
    return label?.textContent || field.getAttribute('aria-label') || field.placeholder || field.name || 'Field'
  }

  private setupSkipLinks() {
    // Create skip navigation links
    const skipNav = document.createElement('div')
    skipNav.className = 'skip-navigation'
    skipNav.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
    `

    // Add CSS for skip links
    const style = document.createElement('style')
    style.textContent = `
      .skip-navigation {
        position: absolute;
        top: -40px;
        left: 6px;
        z-index: 1000;
      }
      
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        font-size: 14px;
        font-weight: bold;
        z-index: 1001;
        transition: top 0.2s ease;
      }
      
      .skip-link:focus {
        top: 6px;
      }
    `

    document.head.appendChild(style)
    document.body.insertBefore(skipNav, document.body.firstChild)
  }

  private getFocusableElements(container: HTMLElement = document.body): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(container.querySelectorAll(selector))
      .filter(el => {
        const element = el as HTMLElement
        return element.offsetWidth > 0 && 
               element.offsetHeight > 0 && 
               !element.hidden &&
               window.getComputedStyle(element).visibility !== 'hidden'
      }) as HTMLElement[]
  }

  // Public methods
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.announcer) return

    this.announcer.setAttribute('aria-live', priority)
    this.announcer.textContent = message

    // Clear after announcement
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = ''
      }
    }, 1000)
  }

  focusElement(element: HTMLElement | string) {
    const target = typeof element === 'string' ? document.querySelector(element) as HTMLElement : element
    if (target) {
      target.focus()
      
      // Scroll into view if needed
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  restoreFocus() {
    const lastFocused = this.focusHistory.pop()
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus()
    }
  }

  checkColorContrast(element: HTMLElement): { ratio: number; passes: boolean; level: string } {
    const styles = window.getComputedStyle(element)
    const color = styles.color
    const backgroundColor = styles.backgroundColor

    // Simple contrast calculation (would need a more robust implementation)
    const ratio = this.calculateContrastRatio(color, backgroundColor)
    
    return {
      ratio,
      passes: ratio >= 4.5,
      level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Fail'
    }
  }

  private calculateContrastRatio(color1: string, color2: string): number {
    // Simplified contrast calculation
    // In a real implementation, you'd convert colors to RGB and calculate luminance
    return 4.5 // Placeholder
  }

  addLandmark(element: HTMLElement, role: string, label?: string) {
    element.setAttribute('role', role)
    if (label) {
      element.setAttribute('aria-label', label)
    }
  }

  enhanceDataTable(table: HTMLTableElement) {
    // Add table caption if missing
    if (!table.caption) {
      const caption = document.createElement('caption')
      caption.textContent = 'Data table'
      table.insertBefore(caption, table.firstChild)
    }

    // Add scope to headers
    table.querySelectorAll('th').forEach(th => {
      if (!th.getAttribute('scope')) {
        th.setAttribute('scope', 'col')
      }
    })

    // Add table summary
    if (!table.getAttribute('aria-describedby')) {
      const summary = document.createElement('div')
      summary.id = `table-summary-${Date.now()}`
      summary.className = 'sr-only'
      summary.textContent = `Table with ${table.rows.length} rows and ${table.rows[0]?.cells.length || 0} columns`
      table.parentNode?.insertBefore(summary, table)
      table.setAttribute('aria-describedby', summary.id)
    }
  }

  destroy() {
    if (this.announcer) {
      document.body.removeChild(this.announcer)
    }
  }
}

// React hooks for accessibility
export const useAccessibility = (options?: AccessibilityOptions) => {
  const manager = new AccessibilityManager(options)

  return {
    announce: (message: string, priority?: 'polite' | 'assertive') => 
      manager.announce(message, priority),
    
    focusElement: (element: HTMLElement | string) => 
      manager.focusElement(element),
    
    restoreFocus: () => 
      manager.restoreFocus(),
    
    checkColorContrast: (element: HTMLElement) => 
      manager.checkColorContrast(element),
    
    addLandmark: (element: HTMLElement, role: string, label?: string) => 
      manager.addLandmark(element, role, label),
    
    enhanceDataTable: (table: HTMLTableElement) => 
      manager.enhanceDataTable(table)
  }
}

// Accessibility testing utilities
export const runAccessibilityAudit = () => {
  const issues: string[] = []

  // Check for missing alt text
  document.querySelectorAll('img:not([alt])').forEach(() => {
    issues.push('Image missing alt text')
  })

  // Check for missing form labels
  document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').forEach(input => {
    const id = (input as HTMLInputElement).id
    if (!document.querySelector(`label[for="${id}"]`)) {
      issues.push('Form input missing label')
    }
  })

  // Check for missing headings structure
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
  if (headings.length === 0) {
    issues.push('Page missing heading structure')
  }

  // Check for missing main landmark
  if (!document.querySelector('main, [role="main"]')) {
    issues.push('Page missing main landmark')
  }

  return issues
}

export default AccessibilityManager
