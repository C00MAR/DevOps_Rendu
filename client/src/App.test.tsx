import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders App', () => {
  render(<App />);
  const paragraphElement = screen.getByRole('paragraph');
  expect(paragraphElement).toBeInTheDocument();
});
