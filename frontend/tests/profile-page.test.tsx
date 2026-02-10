import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfilePage from "@/app/(protected)/profile/page";

const refreshUserMock = jest.fn();
const updateMeMock = jest.fn();
const handleApiResponseMock = jest.fn();
const toastSuccessMock = jest.fn();
const toastErrorMock = jest.fn();

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      email: "user@example.com",
      email_verified: true,
    },
    refreshUser: refreshUserMock,
  }),
}));

jest.mock("@/lib/api", () => ({
  userApi: {
    updateMe: (...args: unknown[]) => updateMeMock(...args),
  },
  handleApiResponse: (...args: unknown[]) => handleApiResponseMock(...args),
}));

jest.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateMeMock.mockResolvedValue({});
  });

  it("pre-fills email from authenticated user", () => {
    render(<ProfilePage />);

    expect(screen.getByLabelText(/email/i)).toHaveValue("user@example.com");
  });

  it("updates profile and refreshes user on success", async () => {
    handleApiResponseMock.mockResolvedValue({
      success: true,
      data: {
        id: "user-1",
        email: "changed@example.com",
        email_verified: true,
      },
    });
    refreshUserMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<ProfilePage />);

    await act(async () => {
      await user.clear(screen.getByLabelText(/email/i));
      await user.type(screen.getByLabelText(/email/i), "changed@example.com");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
    });

    await waitFor(() => {
      expect(updateMeMock).toHaveBeenCalledWith({
        email: "changed@example.com",
      });
      expect(refreshUserMock).toHaveBeenCalledTimes(1);
      expect(toastSuccessMock).toHaveBeenCalledWith("Profile updated");
    });
  });

  it("shows error toast when update fails", async () => {
    handleApiResponseMock.mockResolvedValue({
      success: false,
      error: { message: "Failed to update profile" },
    });
    const user = userEvent.setup();

    render(<ProfilePage />);

    await act(async () => {
      await user.clear(screen.getByLabelText(/email/i));
      await user.type(screen.getByLabelText(/email/i), "bad@example.com");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
    });

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith("Failed to update profile");
    });
    expect(refreshUserMock).not.toHaveBeenCalled();
  });
});
