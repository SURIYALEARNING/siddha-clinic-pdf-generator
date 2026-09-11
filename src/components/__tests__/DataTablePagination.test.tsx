import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTablePagination } from '../DataTablePagination';

describe('DataTablePagination', () => {
  it('returns null when totalRecords is 0', () => {
    const { container } = render(
      <DataTablePagination
        currentPage={1}
        totalRecords={0}
        pageSize={20}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders showing text and page indicators correctly', () => {
    render(
      <DataTablePagination
        currentPage={1}
        totalRecords={28}
        pageSize={20}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );

    expect(screen.getByText(/Showing/)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('handles last page range correctly', () => {
    render(
      <DataTablePagination
        currentPage={2}
        totalRecords={28}
        pageSize={20}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );

    expect(screen.getByText('21')).toBeInTheDocument();
    expect(screen.getAllByText('28')).toHaveLength(2);
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });

  it('disables previous button on first page and enables next button', () => {
    render(
      <DataTablePagination
        currentPage={1}
        totalRecords={28}
        pageSize={20}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );

    const prevBtn = screen.getByTitle('Previous page');
    const nextBtn = screen.getByTitle('Next page');

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();
  });

  it('disables next button on last page and enables previous button', () => {
    render(
      <DataTablePagination
        currentPage={2}
        totalRecords={28}
        pageSize={20}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );

    const prevBtn = screen.getByTitle('Previous page');
    const nextBtn = screen.getByTitle('Next page');

    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).toBeDisabled();
  });

  it('calls onPageChange when clicking next and prev buttons', () => {
    const onPageChange = vi.fn();
    render(
      <DataTablePagination
        currentPage={1}
        totalRecords={50}
        pageSize={10}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTitle('Next page'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageSizeChange when selecting a new page size', () => {
    const onPageSizeChange = vi.fn();
    render(
      <DataTablePagination
        currentPage={1}
        totalRecords={50}
        pageSize={20}
        onPageChange={vi.fn()}
        onPageSizeChange={onPageSizeChange}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '50' } });
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });
});
