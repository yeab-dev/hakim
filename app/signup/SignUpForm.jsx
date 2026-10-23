"use client";

import PropTypes from "prop-types";
import { useActionState, useRef, useState } from "react";
import { signUp } from "@/app/actions";
import Field from "@/components/Field";
import { PASSWORD_HINT, PHONE_HINT, SIGN_UP_FIELDS, validateSignUp } from "@/lib/schema";

// Sign-up: name, number, password, checked with the same validateSignUp() the
// action runs. The action alone decides whether the number is free.
function SignUpForm({ next }) {
  const [state, formAction, pending] = useActionState(signUp, null);
  const [values, setValues] = useState(() => ({
    name: state?.values?.name ?? "",
    phone: state?.values?.phone ?? "",
    password: "",
  }));
  const [touched, setTouched] = useState({});
  const formRef = useRef(null);

  const clientErrors = validateSignUp(values);
  const errorFor = (name) => (touched[name] && clientErrors[name]) || state?.fieldErrors?.[name];
  const update = (name) => (event) => setValues((v) => ({ ...v, [name]: event.target.value }));
  const touch = (name) => (event) => event.target.value && setTouched((t) => ({ ...t, [name]: true }));

  function handleSubmit(event) {
    const firstBad = SIGN_UP_FIELDS.find((name) => clientErrors[name]);
    if (firstBad) {
      event.preventDefault();
      setTouched(Object.fromEntries(SIGN_UP_FIELDS.map((name) => [name, true])));
      formRef.current.elements[firstBad].focus();
    }
  }

  return (
    <form ref={formRef} className="form" action={formAction} onSubmit={handleSubmit} noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <Field
        name="name"
        label="Your name"
        error={errorFor("name")}
        autoComplete="name"
        value={values.name}
        onChange={update("name")}
        onBlur={touch("name")}
      />
      <Field
        name="phone"
        label="Mobile number"
        hint={PHONE_HINT}
        error={errorFor("phone")}
        type="tel"
        inputMode="tel"
        autoComplete="username"
        value={values.phone}
        onChange={update("phone")}
        onBlur={touch("phone")}
      />
      <Field
        name="password"
        label="Password"
        hint={PASSWORD_HINT}
        error={errorFor("password")}
        type="password"
        autoComplete="new-password"
        value={values.password}
        onChange={update("password")}
        onBlur={touch("password")}
      />
      <p>
        <button type="submit" className="button" disabled={pending}>
          {pending ? "Creating your account…" : "Create account"}
        </button>
      </p>
    </form>
  );
}

SignUpForm.propTypes = {
  next: PropTypes.string,
};

export default SignUpForm;
