import type { FormEvent } from "react";
import { useState } from "react";
import type { ComplaintCategory } from "../lib/validators";
import {
  CATEGORY_LABELS,
  COMPLAINT_CATEGORIES,
  COPY,
  getFieldError,
  validateComplaintForm,
  type ComplaintFormValues,
  type FieldError,
} from "../lib/validators";
import { createComplaint } from "../lib/api";

const initialValues: ComplaintFormValues = {
  name: "",
  email: "",
  category: "",
  message: "",
};

export function FeedbackForm() {
  const [values, setValues] = useState<ComplaintFormValues>(initialValues);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    const validation = validateComplaintForm(values);
    setErrors(validation.errors);

    if (!validation.valid || !values.category) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createComplaint({
        name: values.name.trim(),
        email: values.email.trim(),
        category: values.category,
        message: values.message.trim(),
      });

      setValues(initialValues);
      setErrors([]);
      setSuccessMessage(COPY.successMessage);
    } catch {
      setServerError(COPY.serverErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<K extends keyof ComplaintFormValues>(
    field: K,
    value: ComplaintFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  return (
    <section className="card">
      <h1>{COPY.formTitle}</h1>

      {successMessage ? (
        <p role="status" className="banner success">
          {successMessage}
        </p>
      ) : null}

      {serverError ? (
        <p role="alert" className="banner error">
          {serverError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="name">{COPY.nameLabel}</label>
        <input
          id="name"
          name="name"
          value={values.name}
          onChange={(event) => updateField("name", event.target.value)}
          aria-invalid={Boolean(getFieldError(errors, "name"))}
          aria-describedby={getFieldError(errors, "name") ? "name-error" : undefined}
        />
        {getFieldError(errors, "name") ? (
          <p id="name-error" className="field-error">
            {getFieldError(errors, "name")}
          </p>
        ) : null}

        <label htmlFor="email">{COPY.emailLabel}</label>
        <input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={(event) => updateField("email", event.target.value)}
          aria-invalid={Boolean(getFieldError(errors, "email"))}
          aria-describedby={getFieldError(errors, "email") ? "email-error" : undefined}
        />
        {getFieldError(errors, "email") ? (
          <p id="email-error" className="field-error">
            {getFieldError(errors, "email")}
          </p>
        ) : null}

        <label htmlFor="category">{COPY.categoryLabel}</label>
        <select
          id="category"
          name="category"
          value={values.category}
          onChange={(event) =>
            updateField("category", event.target.value as ComplaintCategory | "")
          }
          aria-invalid={Boolean(getFieldError(errors, "category"))}
          aria-describedby={
            getFieldError(errors, "category") ? "category-error" : undefined
          }
        >
          <option value="">Select a category</option>
          {COMPLAINT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
        {getFieldError(errors, "category") ? (
          <p id="category-error" className="field-error">
            {getFieldError(errors, "category")}
          </p>
        ) : null}

        <label htmlFor="message">{COPY.messageLabel}</label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={values.message}
          onChange={(event) => updateField("message", event.target.value)}
          aria-invalid={Boolean(getFieldError(errors, "message"))}
          aria-describedby={
            getFieldError(errors, "message") ? "message-error" : undefined
          }
        />
        {getFieldError(errors, "message") ? (
          <p id="message-error" className="field-error">
            {getFieldError(errors, "message")}
          </p>
        ) : null}

        <button type="submit" disabled={isSubmitting}>
          {COPY.submitButton}
        </button>
      </form>
    </section>
  );
}
