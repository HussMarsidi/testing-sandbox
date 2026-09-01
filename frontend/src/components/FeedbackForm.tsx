import type { FormEvent } from "react";
import { useState } from "react";
import { createComplaint } from "../lib/api";
import { useCategories } from "../context/CategoriesContext";
import {
  COPY,
  getFieldError,
  validateComplaintForm,
  type ComplaintFormValues,
  type FieldError,
} from "../lib/validators";
import type { CreateComplaint } from "../lib/api";

const initialValues: ComplaintFormValues = {
  name: "",
  email: "",
  category: "",
  message: "",
};

export function FeedbackForm() {
  const { categories, isLoading, error: categoriesError } = useCategories();
  const [values, setValues] = useState<ComplaintFormValues>(initialValues);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoriesUnavailable = Boolean(categoriesError);
  const formDisabled = isLoading || categoriesUnavailable || isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    if (categoriesUnavailable) {
      return;
    }

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
        category: values.category as CreateComplaint["category"],
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

      {categoriesUnavailable ? (
        <p role="alert" className="banner error">
          {COPY.categoriesLoadError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="name">{COPY.nameLabel}</label>
        <input
          id="name"
          name="name"
          value={values.name}
          disabled={formDisabled}
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
          disabled={formDisabled}
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
          disabled={formDisabled}
          onChange={(event) => updateField("category", event.target.value)}
          aria-invalid={Boolean(getFieldError(errors, "category"))}
          aria-describedby={
            getFieldError(errors, "category") ? "category-error" : undefined
          }
        >
          <option value="">
            {isLoading ? "Loading categories..." : "Select a category"}
          </option>
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
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
          disabled={formDisabled}
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

        <button type="submit" disabled={formDisabled}>
          {COPY.submitButton}
        </button>
      </form>
    </section>
  );
}
