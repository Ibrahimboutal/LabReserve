import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingScreen from '../../components/LoadingScreen';

describe('LoadingScreen Component', () => {
  it('renders with default message', () => {
    render(<LoadingScreen />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    const customMessage = 'Custom loading message';
    render(<LoadingScreen message={customMessage} />);
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });
});