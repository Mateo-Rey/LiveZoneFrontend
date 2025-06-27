import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { ParkDataProvider } from "../context/ParkDataContext";
import "../App.css"
export const Route = createRootRoute({
  component: () => (
    <ParkDataProvider>
      <div className="link-container">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>
        <Link to="/heatmap" className="[&.active]:font-bold">
          Heatmap
        </Link>
      </div>
     
      <Outlet />
      
    </ParkDataProvider>
  ),
});
