import { FormEvent, useEffect, useRef, useState } from "react";

type Field = "name" | "email" | "message";
type Language = "ES" | "EN";

const RECIPIENT = "marcosmariness@gmail.com";

const copy = {
  ES: {
    name: "NOMBRE",
    email: "EMAIL",
    message: "MENSAJE",
    placeholders: {
      name: "Tu nombre",
      email: "tu@email.com",
      message: "Cuéntame brevemente",
    },
    errors: {
      name: "Escribe tu nombre",
      email: "Revisa el formato del email",
      message: "Escribe un breve mensaje",
    },
    submit: "Preparar email",
    sent: "Email preparado. Revisa tu aplicación de correo.",
    subject: (_name: string) => "Contacto desde tu portfolio",
    body: (message: string, name: string, email: string) =>
      `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`,
  },
  EN: {
    name: "NAME",
    email: "EMAIL",
    message: "MESSAGE",
    placeholders: { name: "Your name", email: "you@email.com", message: "Tell me briefly" },
    errors: {
      name: "Please enter your name",
      email: "Check the email format",
      message: "Please write a short message",
    },
    submit: "Prepare email",
    sent: "Email prepared. Check your mail app.",
    subject: (_name: string) => "Contact from your portfolio",
    body: (message: string, name: string, email: string) =>
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
  },
};

const fields: { key: Field; index: string }[] = [
  { key: "name", index: "01" },
  { key: "email", index: "02" },
  { key: "message", index: "03" },
];

const isValid = (field: Field, value: string) => {
  const text = value.trim();
  if (field === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  return text.length > 0;
};

export function ContactForm({ language }: { language: Language }) {
  const t = copy[language];
  const [values, setValues] = useState<Record<Field, string>>({ name: "", email: "", message: "" });
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    name: false,
    email: false,
    message: false,
  });
  const [sent, setSent] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!sent) return;
    const id = window.setTimeout(() => setSent(false), 6000);
    return () => window.clearTimeout(id);
  }, [sent]);

  const update = (field: Field, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setSent(false);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ name: true, email: true, message: true });
    const firstInvalid = fields.find(({ key }) => !isValid(key, values[key]));
    if (firstInvalid) {
      form.current?.querySelector<HTMLElement>(`[name="${firstInvalid.key}"]`)?.focus();
      return;
    }
    const subject = encodeURIComponent(t.subject(values.name.trim()));
    const body = encodeURIComponent(
      t.body(values.message.trim(), values.name.trim(), values.email.trim()),
    );
    window.location.href = `mailto:${RECIPIENT}?subject=${subject}&body=${body}`;
    setSent(true);
    setValues({ name: "", email: "", message: "" });
    setTouched({ name: false, email: false, message: false });
  };

  return (
    <form ref={form} onSubmit={submit} noValidate data-reveal>
      {fields.map(({ key, index }) => {
        const invalid = touched[key] && !isValid(key, values[key]);
        const shared = {
          name: key,
          value: values[key],
          placeholder: t.placeholders[key],
          "aria-invalid": invalid,
          "aria-describedby": invalid ? `error-${key}` : undefined,
          onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            update(key, event.target.value),
          onBlur: () => setTouched((current) => ({ ...current, [key]: true })),
        };
        return (
          <label
            key={key}
            className={`field ${values[key] ? "filled" : ""} ${invalid ? "invalid" : ""}`}
          >
            <span>
              {index} / {t[key]}
            </span>
            {key === "message" ? (
              <textarea rows={2} {...shared} />
            ) : (
              <input type={key === "email" ? "email" : "text"} autoComplete={key} {...shared} />
            )}
            <em className="field-error" id={`error-${key}`} role={invalid ? "alert" : undefined}>
              {invalid ? t.errors[key] : ""}
            </em>
          </label>
        );
      })}
      <button type="submit" data-magnetic>
        {t.submit} <span>→</span>
      </button>
      <p className={`form-status ${sent ? "show" : ""}`} role="status">
        {sent ? t.sent : ""}
      </p>
    </form>
  );
}
