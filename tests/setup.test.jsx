import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

const TestComponent = () => <div>Test Title</div>;

describe('React Testing Library Setup', () => {
  it('renders a component correctly', () => {
    render(<TestComponent />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
});
