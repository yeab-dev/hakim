import { BrowserRouter, Route, Routes } from "react-router-dom";
import Appointment from "./appointments/Appointment";
import Appointments from "./appointments/Appointments";
import Book from "./booking/Book";
import Clinic from "./clinics/Clinic";
import Clinics from "./clinics/Clinics";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Layout from "./ui/Layout";

// The route map from README.md, one <Route> per row.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="clinics" element={<Clinics />} />
          <Route path="clinics/:clinicId" element={<Clinic />} />
          <Route path="book/:slotId" element={<Book />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="appointments/:appointmentId" element={<Appointment />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
