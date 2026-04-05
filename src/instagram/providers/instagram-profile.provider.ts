export type FetchedInstagramProfile = {
  normalizedHandle: string;
  displayHandle: string;
  externalAvatarUrl: string;
  provider: string;
};

export interface InstagramProfileProvider {
  fetchProfile(handle: string): Promise<FetchedInstagramProfile>;
}