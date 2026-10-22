import { createContext } from "react";

// Private to the auth folder: everything else goes through useAuth().
export const AuthContext = createContext(null);
