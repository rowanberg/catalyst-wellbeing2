import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveClass(className: string): R;
      toHaveTextContent(text: string): R;
      toBeVisible(): R;
      toBeChecked(): R;
      toHaveValue(value: string | number): R;
    }
  }
}
