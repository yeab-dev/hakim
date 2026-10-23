"use client";

import PropTypes from "prop-types";
import { useActionState, useState } from "react";
import { signIn } from "@/app/actions";
import Field from "@/components/Field";
import { PHONE_HINT, phoneError } from "@/lib/schema";

// The sign-in form. The server action checks everything again and decides
// whether the number and password match; the checks here only save a round
// trip. Without JavaScript the form still posts to the action and comes back
// with its errors. The password is never sent back in the action's state.
//
// Fields are checked on submit, then re-checked as you correct them — not on
// blur: an error appearing under the phone field as focus leaves it would
// push the Sign in button away from the pointer in the middle of the click.
function LoginForm({ next }) {
  const [state, formAction, pending] = useActionState(signIn, null);
  const [phone, setPhone] = useState(state?.values?.phone ?? "");
  const [clientErrors, setClientErrors] = useState({});
  const errorFor = (name) => clientErrors[name] ?? state?.fieldErrors?.[name];

  function handleSubmit(event) {
    const form = event.currentTarget;
    const errors = {};
    const phoneProblem = phoneError(phone);
    if (phoneProblem) errors.phone = phoneProblem;
    if (!form.elements.password.value) errors.password = "Enter your password";
    setClientErrors(errors);
    const firstBad = ["phone", "password"].find((name) => errors[name]);
    if (firstBad) {
      event.preventDefault();
      form.elements[firstBad].focus();
    }
  }

  return (
    <form className="form" action={formAction} onSubmit={handleSubmit} noValidate>
      {state?.formError && (
        <p className="banner banner--error" role="alert">
          {state.formError}
        </p>
      )}
      <input type="hidden" name="next" value={next ?? ""} />
      <Field
        name="phone"
        label="Mobile number"
        hint={PHONE_HINT}
        error={errorFor("phone")}
        type="tel"
        inputMode="tel"
        autoComplete="username"
        value={phone}
        onChange={(event) => {
          setPhone(event.target.value);
          if (clientErrors.phone) setClientErrors((e) => ({ ...e, phone: phoneError(event.target.value) }));
        }}
      />
      <Field
        name="password"
        label="Password"
        error={errorFor("password")}
        type="password"
        autoComplete="current-password"
        onChange={() => clientErrors.password && setClientErrors((e) => ({ ...e, password: undefined }))}
      />
      <p>
        <button type="submit" className="button" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </p>
    </form>
  );
}

LoginForm.propTypes = {
  next: PropTypes.string,
};

export default LoginForm;
