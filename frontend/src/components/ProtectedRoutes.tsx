import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Loader from "./Loader";

export default function ProtectedRoutes() {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loader />
    }

    return(
        <div>
            {user ? <Outlet /> : <Navigate to={"/login"} />}            
        </div>
    )
}