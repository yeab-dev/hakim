import { useParams } from "react-router-dom";
import Placeholder from "../ui/Placeholder";

function Book() {
  const { slotId } = useParams();

  return (
    <>
      <h1>Book slot {slotId}</h1>
      <Placeholder needs="the slot (doctor, clinic, time) and the signed-in user; a validated patient form" />
    </>
  );
}

export default Book;
