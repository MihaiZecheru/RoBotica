import { User } from "@supabase/supabase-js";
import supabase from "./supabase-config";
import { UserID } from "./ID";
import TLanguage from "./TLanguage";

export type TUserSettings = {
  level: 'Beginner' | 'Intermediate';
  language: TLanguage;
  gender: 'Man' | 'Woman';
};

export default async function GetUser(): Promise<User> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Error retrieving user: ', error);
    // If there was a bug just have him sign in again
    await supabase.auth.signOut();
    throw error;
  }

  return data.user;
}

export async function GetUserID(): Promise<UserID> {
  return (await GetUser()).id as UserID;
}

/**
 * Get a user's settings for RoBotica.
 */
export async function GetUserSettings(user_id: UserID): Promise<TUserSettings> {
  const { data, error } = await supabase
    .from('UserSettings')
    .select('*')
    .eq('user_id', user_id);

  if (error) {
    console.error('Error retrieving user settings: ', error);
    throw error;
  }

  return data![0] as TUserSettings;
}