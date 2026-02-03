import ProtectedRoute from "../components/ProtectedRoute";
import SalesListPage from "../pages/Page";

export default function SalesPage() {
  return (
    <ProtectedRoute>
      <SalesListPage />
    </ProtectedRoute>
  );
}
