import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ParkDataProvider } from "../context/ParkDataContext";

export const Route = createRootRoute({
  component: () => (
    <ParkDataProvider>
      <div className="p-2 flex gap-10">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>
        <Link to="/heatmap" className="[&.active]:font-bold">
          Heatmap
        </Link>
      </div>
      <hr />
      <Outlet />
      
    </ParkDataProvider>
  ),
});
