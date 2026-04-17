🧠 REAL MODULE EXAMPLE — roles
________________________________________
📁 STRUCTURE
src/modules/roles/
  src/
    index.js
    pages/
      RolesPage.jsx
    components/
      RolesTable.jsx
    services/
      useRoles.js
    repo/
      roles.repo.js
    model/
      roles.model.js
    hooks/
      useRolesTable.js
    utils/
________________________________________
🧱 1. MODEL (maps DB → UI)
// model/roles.model.js

export function mapRole(row) {
  return {
    id: row.role_id,
    name: row.role_name,
    description: row.role_desc,
    isActive: row.is_active,
    createdAt: row.created_at
  };
}
________________________________________
🧱 2. REPO (Supabase only)
// repo/roles.repo.js

import { supabase } from "@/core/supabaseClient";
import { mapRole } from "../model/roles.model";

const TABLE = "psb_s_role";

export const rolesRepo = {

  async getAll() {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return data.map(mapRole);
  },

  async insert(payload) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        role_name: payload.name,
        role_desc: payload.description,
        is_active: true
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    return mapRole(data);
  },

  async update(payload) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        role_name: payload.name,
        role_desc: payload.description,
        is_active: payload.isActive,
        updated_at: new Date()
      })
      .eq("role_id", payload.id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    return mapRole(data);
  },

  async delete(id) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq("role_id", id);

    if (error) throw new Error(error.message);

    return true;
  }
};
________________________________________
🧱 3. SERVICE (business layer)
// services/useRoles.js

import { rolesRepo } from "../repo/roles.repo";

export const useRolesService = {

  async getRoles() {
    return await rolesRepo.getAll();
  },

  async createRole(data) {
    if (!data.name) throw new Error("Role name is required");
    return await rolesRepo.insert(data);
  },

  async updateRole(data) {
    return await rolesRepo.update(data);
  },

  async deleteRole(id) {
    return await rolesRepo.delete(id);
  }
};
________________________________________
🧱 4. HOOK (UI state control)
// hooks/useRolesTable.js

import { useEffect, useState } from "react";
import { useRolesService } from "../services/useRoles";

export function useRolesTable() {
  const [data, setData] = useState([]);

  async function load() {
    const res = await useRolesService.getRoles();
    setData(res);
  }

  useEffect(() => {
    load();
  }, []);

  return {
    data,
    reload: load
  };
}
________________________________________
🧱 5. COMPONENT (pure UI)
// components/RolesTable.jsx

export default function RolesTable({ data, onDelete }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {data.map(role => (
          <tr key={role.id}>
            <td>{role.name}</td>
            <td>{role.isActive ? "Active" : "Inactive"}</td>
            <td>
              <button onClick={() => onDelete(role.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
________________________________________
🧱 6. PAGE (orchestrator)
// pages/RolesPage.jsx

import RolesTable from "../components/RolesTable";
import { useRolesTable } from "../hooks/useRolesTable";
import { useRolesService } from "../services/useRoles";

export default function RolesPage() {
  const { data, reload } = useRolesTable();

  async function handleDelete(id) {
    await useRolesService.deleteRole(id);
    reload();
  }

  return (
    <div>
      <h1>Roles</h1>
      <RolesTable data={data} onDelete={handleDelete} />
    </div>
  );
}
________________________________________
🧱 7. INDEX (module entry)
// index.js

import RolesPage from "./pages/RolesPage";

export default {
  route: "/roles",
  component: RolesPage
};
________________________________________
🔗 WHAT THIS PROVES
This is now:
•	✔ Real DB (your table) 
•	✔ Real CRUD 
•	✔ Clean separation 
•	✔ No overengineering 
•	✔ No DTO/interface bloat 
•	✔ Still scalable 
________________________________________
💣 Important (don’t miss this)
This line:
return data.map(mapRole);
👉 That’s your entire protection layer
Remove that → your system degrades fast.

