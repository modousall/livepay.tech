import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

/**
 * Example Test Suite
 * This is a template for testing React components
 *
 * Run: npm test -- App.test.tsx
 */

describe('Example Test Suite', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });

  it('should do basic math', () => {
    expect(2 + 2).toBe(4);
  });

  it('should handle strings', () => {
    const text = 'LivePay';
    expect(text).toContain('Pay');
  });

  it('should work with objects', () => {
    const order = {
      id: '123',
      amount: 15000,
      status: 'pending',
    };

    expect(order).toHaveProperty('id', '123');
    expect(order.amount).toBeGreaterThan(0);
  });

  it('should handle arrays', () => {
    const products = ['Robe', 'Chaussure', 'Sac'];
    expect(products).toHaveLength(3);
    expect(products).toContain('Robe');
  });
});

/**
 * Component Testing Example
 *
 * describe('MyComponent', () => {
 *   it('should render text', () => {
 *     render(<MyComponent text="Hello" />);
 *     expect(screen.getByText('Hello')).toBeInTheDocument();
 *   });
 * });
 */
