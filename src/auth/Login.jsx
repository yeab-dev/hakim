import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";

function Login() {
  const { user, signIn } = useAuth();
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const destination = from ? `${from.pathname}${from.search}` : "/appointments";

  function handleSubmit(event) {
    event.preventDefault();
    signIn(phone.trim());
    navigate(destination, { replace: true });
  }

  if (user) {
    return (
      <>
        <h1>Already signed in</h1>
        <p>You are signed in as {user.phone}.</p>
      </>
    );
  }

  return (
    <>
      <h1>Sign in</h1>
      <p>Booking and your appointments need a phone number. There is no password yet — any 09… number works.</p>
      <form className="login" onSubmit={handleSubmit}>
        <label htmlFor="phone">Phone number</label>
        <input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <button type="submit">Continue</button>
      </form>
    </>
  );
}

export default Login;
