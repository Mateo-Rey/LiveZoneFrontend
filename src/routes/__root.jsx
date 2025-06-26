import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { ParkDataProvider } from "../context/ParkDataContext";

export const Route = createRootRoute({
  component: () => (
    <ParkDataProvider>
      <div style={{display:"flex", padding: "20px", gap:"10px", justifyContent:"center", background: "rgb(10,10,10)", width: "150px", margin: "10px auto", borderRadius: "5px"}}>
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
