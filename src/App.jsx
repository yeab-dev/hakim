import { BrowserRouter, Route, Routes } from "react-router-dom";
import Appointment from "./appointments/Appointment";
import Appointments from "./appointments/Appointments";
import AuthProvider from "./auth/AuthProvider";
import Login from "./auth/Login";
import RequireAuth from "./auth/RequireAuth";
import Book from "./booking/Book";
import Clinic from "./clinics/Clinic";
import Clinics from "./clinics/Clinics";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Layout from "./ui/Layout";

// The route map from README.md, one <Route> per row. The three marked
// "Sign-in: Yes" are wrapped in RequireAuth.
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="clinics" element={<Clinics />} />
            <Route path="clinics/:clinicId" element={<Clinic />} />
            <Route
              path="book/:slotId"
              element={
                <RequireAuth>
                  <Book />
                </RequireAuth>
              }
            />
            <Route
              path="appointments"
              element={
                <RequireAuth>
                  <Appointments />
                </RequireAuth>
              }
            />
            <Route
              path="appointments/:appointmentId"
              element={
                <RequireAuth>
                  <Appointment />
                </RequireAuth>
              }
            />
            <Route path="login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
