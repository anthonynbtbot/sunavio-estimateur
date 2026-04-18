import { ProtectedAdmin } from "@/components/admin/ProtectedAdmin";
import { AdminLeadsList } from "@/components/admin/AdminLeadsList";

const Admin = () => (
  <ProtectedAdmin>
    <AdminLeadsList />
  </ProtectedAdmin>
);

export default Admin;
