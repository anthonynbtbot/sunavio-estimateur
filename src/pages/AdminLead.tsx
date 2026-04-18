import { ProtectedAdmin } from "@/components/admin/ProtectedAdmin";
import { AdminLeadDetail } from "@/components/admin/AdminLeadDetail";

const AdminLead = () => (
  <ProtectedAdmin>
    <AdminLeadDetail />
  </ProtectedAdmin>
);

export default AdminLead;
