import React from 'react';
import { render, screen } from '@testing-library/react';
import MetricCard from '../../src/components/cards/MetricCard';
import CasesIcon from '@mui/icons-material/Cases';

// Mock MUI useTheme to provide a basic empty theme to component if it needed it
jest.mock('@mui/material/styles', () => ({
  ...jest.requireActual('@mui/material/styles'),
  useTheme: () => ({ palette: { primary: { main: '#000' } } }),
}));

describe('MetricCard Component', () => {
  it('renders correctly with given props', () => {
    render(
      <MetricCard
        title="Total Test"
        value={42}
        subtitle="Subtitle Test"
        icon={CasesIcon}
      />
    );

    expect(screen.getByText('Total Test')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Subtitle Test')).toBeInTheDocument();
  });
});
