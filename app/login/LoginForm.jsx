"use client";

import PropTypes from "prop-types";
import { useActionState, useState } from "react";
import { signIn } from "@/app/actions";
import Field from "@/components/Field";
import { PHONE_HINT, phoneError } from "@/lib/schema";

// The sign-in form. The server action checks the number again with the same
// rule; the check here only saves a round trip. Without JavaScript the form
// still posts to the action and comes back with its errors.
function LoginForm({ from }) {
  const [state, formAction, pending] = useActionState(signIn, null);
  const [phone, setPhone] = useState(state?.values?.phone ?? "");
  const [clientError, setClientError] = useState();
  const error = clientError ?? state?.fieldErrors?.phone;

  function handleSubmit(event) {
    const problem = phoneError(phone);
    if (problem) {
      event.preventDefault();
      setClientError(problem);
      event.currentTarget.elements.phone.focus();
    }
  }

  return (
    <form className="form" action={formAction} onSubmit={handleSubmit} noValidate>
      <input type="hidden" name="from" value={from ?? ""} />
      <Field
        name="phone"
        label="Mobile number"
        hint={PHONE_HINT}
        error={error}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={phone}
        onChange={(event) => {
          setPhone(event.target.value);
          if (clientError) setClientError(phoneError(event.target.value));
        }}
        onBlur={() => phone && setClientError(phoneError(phone))}
      />
      <p>
        <button type="submit" className="button" disabled={pending}>
          {pending ? "Signing in…" : "Continue"}
        </button>
      </p>
    </form>
  );
}

LoginForm.propTypes = {
  from: PropTypes.string,
};

export default LoginForm;
