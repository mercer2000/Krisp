export interface VipContact {
  id: string;
  tenant_id: string;
  email: string;
  domain: string | null;
  display_name: string | null;
  notify_on_new: boolean;
  created_at: string;
  updated_at: string;
}

export interface VipContactListItem {
  id: string;
  email: string;
  domain: string | null;
  display_name: string | null;
  notify_on_new: boolean;
  created_at: string;
}
