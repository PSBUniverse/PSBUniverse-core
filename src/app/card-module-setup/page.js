import ModuleAccessGate from "@/core/auth/ModuleAccessGate";
import CardModuleSetupClient from "./CardModuleSetupClient";
import { loadCardModuleSetupData } from "@/modules/card-module-setup/hooks/cardModuleSetupData.js";
import { getSupabase } from "@/modules/card-module-setup/utils/supabase.js";

export const dynamic = "force-dynamic";

const appIdFromEnv = Number(process.env.CARD_MODULE_SETUP_APP_ID);
const cardModuleSetupAppId = Number.isFinite(appIdFromEnv) ? appIdFromEnv : 1;

async function loadApplications() {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("psb_s_application")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function parseAppId(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const asNumber = Number(value);

  if (Number.isFinite(asNumber)) {
    return asNumber;
  }

  return String(value);
}

export default async function CardModuleSetupPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;

  try {
    const [viewModel, applications] = await Promise.all([
      loadCardModuleSetupData(),
      loadApplications(),
    ]);

    const cardGroups = Array.isArray(viewModel?.cardGroups) ? viewModel.cardGroups : [];
    const cards = Array.isArray(viewModel?.cards) ? viewModel.cards : [];

    const initialSelectedAppId =
      parseAppId(resolvedSearchParams?.app)
      ?? applications[0]?.app_id
      ?? null;

    return (
      <ModuleAccessGate appId={cardModuleSetupAppId}>
        <CardModuleSetupClient
          applications={applications}
          cardGroups={cardGroups}
          cards={cards}
          initialSelectedAppId={initialSelectedAppId}
        />
      </ModuleAccessGate>
    );
  } catch (error) {
    return (
      <ModuleAccessGate appId={cardModuleSetupAppId}>
        <main className="container py-4">
          <div className="notice-banner notice-banner-danger mb-0">
            <strong className="d-block">Failed to load card module setup.</strong>
            <span>{error?.message || "Unknown error"}</span>
          </div>
        </main>
      </ModuleAccessGate>
    );
  }
}
