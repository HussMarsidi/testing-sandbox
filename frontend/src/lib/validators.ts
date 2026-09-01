export const COPY = {
  formTitle: "Send feedback",
  nameLabel: "Name",
  emailLabel: "Email",
  categoryLabel: "Category",
  messageLabel: "Message",
  submitButton: "Submit feedback",
  successMessage: "Thank you! Your feedback has been received.",
  serverErrorMessage: "Something went wrong. Please try again.",
  categoriesLoadError: "Could not load categories. Please try again.",
  validation: {
    nameRequired: "Name is required.",
    emailRequired: "Email is required.",
    emailInvalid: "Enter a valid email address.",
    categoryRequired: "Select a category.",
    messageRequired: "Message is required.",
    messageTooShort: "Message must be at least 10 characters.",
    messageTooLong: "Message must be 2000 characters or fewer.",
  },
  complaintsPageTitle: "All complaints",
  complaintsEmpty: "No complaints yet.",
  complaintsLoadError: "Could not load complaints. Please try again.",
  complaintDetailTitle: "Complaint details",
  complaintLoadError: "Could not load this complaint. Please try again.",
  complaintNotFound: "Complaint not found.",
  complaintUpdateError: "Could not update status. Please try again.",
  statusLabel: "Status",
  statusFilterLabel: "Filter by status",
  searchLabel: "Search complaints",
  searchPlaceholder: "Name, email, or message",
  allStatusesOption: "All statuses",
  viewDetailsLink: "View details",
  backToList: "Back to all complaints",
  forbiddenStatusChange: "You do not have permission to change status.",
  loginTitle: "Sign in",
  usernameLabel: "Username",
  passwordLabel: "Password",
  loginButton: "Sign in",
  loginError: "Invalid username or password.",
  loginServerError: "Could not sign in. Please try again.",
  nav: {
    feedback: "Send feedback",
    complaints: "View complaints",
    login: "Sign in",
    logout: "Sign out",
  },
} as const;

export interface ComplaintFormValues {
  name: string;
  email: string;
  category: string;
  message: string;
}

export interface FieldError {
  field: keyof ComplaintFormValues;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: FieldError[];
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateComplaintForm(
  values: ComplaintFormValues,
): ValidationResult {
  const errors: FieldError[] = [];

  if (!values.name.trim()) {
    errors.push({ field: "name", message: COPY.validation.nameRequired });
  }

  if (!values.email.trim()) {
    errors.push({ field: "email", message: COPY.validation.emailRequired });
  } else if (!isValidEmail(values.email.trim())) {
    errors.push({ field: "email", message: COPY.validation.emailInvalid });
  }

  if (!values.category) {
    errors.push({
      field: "category",
      message: COPY.validation.categoryRequired,
    });
  }

  const message = values.message.trim();
  if (!message) {
    errors.push({ field: "message", message: COPY.validation.messageRequired });
  } else if (message.length < 10) {
    errors.push({ field: "message", message: COPY.validation.messageTooShort });
  } else if (message.length > 2000) {
    errors.push({ field: "message", message: COPY.validation.messageTooLong });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getFieldError(
  errors: FieldError[],
  field: keyof ComplaintFormValues,
): string | undefined {
  return errors.find((error) => error.field === field)?.message;
}
