import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockSetActiveTab = vi.fn();
const mockUseClinic = vi.fn();
const mockLogout = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../../context/ClinicContext', () => ({
  useClinic: (...args: any[]) => mockUseClinic(...args),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: (...args: any[]) => mockUseAuth(...args),
}));

import { Sidebar } from '../Sidebar';

const defaultSettings = {
  logo: '',
  name: 'My Clinic',
  address: '',
  phone: '',
  email: '',
  website: '',
  signature: '',
  footerText: '',
  doctors: [],
  selectedDoctorId: '',
};

function defaultClinicMock() {
  return {
    activeTab: 'dashboard',
    setActiveTab: mockSetActiveTab,
    settings: { ...defaultSettings },
  };
}

function defaultAuthMock() {
  return {
    user: { id: '1', name: 'Dr. Test', email: 'test@clinic.com' },
    logout: mockLogout,
  };
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseClinic.mockReturnValue(defaultClinicMock());
    mockUseAuth.mockReturnValue(defaultAuthMock());
  });

  it('renders all 5 menu items', () => {
    render(<Sidebar isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Patient Information')).toBeInTheDocument();
    expect(screen.getByText('Medicine Entry')).toBeInTheDocument();
    expect(screen.getByText('Document Preview')).toBeInTheDocument();
    expect(screen.getByText('Clinic Settings')).toBeInTheDocument();
  });

  it('highlights active menu item', () => {
    mockUseClinic.mockReturnValue({
      ...defaultClinicMock(),
      activeTab: 'patient',
    });
    render(<Sidebar isOpen={true} onClose={vi.fn()} />);
    const patientBtn = screen.getByText('Patient Information').closest('button');
    expect(patientBtn?.className).toContain('bg-blue-600');
  });

  it('calls setActiveTab when menu item clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar isOpen={true} onClose={vi.fn()} />);
    await user.click(screen.getByText('Medicine Entry'));
    expect(mockSetActiveTab).toHaveBeenCalledWith('medicines');
  });

  it('shows settings.name in footer', () => {
    render(<Sidebar isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('My Clinic')).toBeInTheDocument();
  });

  it('shows logo when settings.logo exists', () => {
    mockUseClinic.mockReturnValue({
      ...defaultClinicMock(),
      settings: { ...defaultSettings, logo: 'data:image/png;base64,test' },
    });
    render(<Sidebar isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
  });

  it('shows initials when no logo', () => {
    mockUseClinic.mockReturnValue({
      ...defaultClinicMock(),
      settings: { ...defaultSettings, logo: '' },
    });
    render(<Sidebar isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('LH')).toBeInTheDocument();
  });

  it('shows user name and email when user exists', () => {
    render(<Sidebar isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Dr. Test')).toBeInTheDocument();
    expect(screen.getByText('test@clinic.com')).toBeInTheDocument();
  });

  it('logout button calls logout', async () => {
    mockLogout.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<Sidebar isOpen={true} onClose={vi.fn()} />);
    await user.click(screen.getByText('Sign Out'));
    expect(mockLogout).toHaveBeenCalled();
  });

  it('close button calls onClose', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Sidebar isOpen={true} onClose={onClose} />);
    await user.click(screen.getByLabelText('Close sidebar'));
    expect(onClose).toHaveBeenCalled();
  });

  it('sidebar is visible when isOpen=true, hidden when isOpen=false', () => {
    const { container, rerender } = render(<Sidebar isOpen={true} onClose={vi.fn()} />);
    const aside = container.querySelector('#clinic-sidebar')!;
    expect(aside.classList.contains('translate-x-0')).toBe(true);
    expect(aside.classList.contains('-translate-x-full')).toBe(false);

    rerender(<Sidebar isOpen={false} onClose={vi.fn()} />);
    expect(aside.classList.contains('-translate-x-full')).toBe(true);
    expect(aside.classList.contains('translate-x-0')).toBe(false);
  });

  it('loading state during logout', async () => {
    let resolveLogout: () => void;
    mockLogout.mockReturnValue(new Promise<void>((resolve) => {
      resolveLogout = resolve;
    }));
    const user = userEvent.setup();
    render(<Sidebar isOpen={true} onClose={vi.fn()} />);

    const clickPromise = user.click(screen.getByText('Sign Out'));

    await waitFor(() => {
      expect(screen.getByText('Signing out...')).toBeInTheDocument();
    });

    resolveLogout!();
    await clickPromise;
  });
});
