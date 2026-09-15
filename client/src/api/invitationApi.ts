/** Thin typed API client. Keeps fetch details out of components. */
import type {
  CreateInvitationInput,
  CreateInvitationResponse,
  GoogleStatusDTO,
} from "@shared/invitation.types";

const BASE = "/api";

async function parse<T>(res: Response): Promise<T> {
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error(
      `The server sent something unexpected (${res.status}). Try again?`,
    );
  }
  if (!res.ok) {
    const message =
      (data as { error?: string }).error ??
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export async function createInvitation(
  input: CreateInvitationInput,
): Promise<CreateInvitationResponse> {
  return parse<CreateInvitationResponse>(
    await fetch(`${BASE}/invitation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function fetchGoogleStatus(): Promise<GoogleStatusDTO> {
  return parse<GoogleStatusDTO>(await fetch(`${BASE}/google/status`));
}
