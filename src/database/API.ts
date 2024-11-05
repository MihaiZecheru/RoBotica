import supabase from "./supabase-config";

export default class API {
  /**
   * Register a user with the application. Make sure that the password is at least 8 characters long and contains both a letter and a number.
   * 
   * @param email The email the user is registering with.
   * @param password The password the user is registering with in plain text format. Will be hashed before being stored.
   * @returns True if the user was successfully registered, false otherwise. 
   * @throws Error if there was an issue with the database query (internal server error).
  */
  public static async RegisterUserAsync(email: string, password: string): Promise<boolean> {
    if (password.length < 8 || email.length === 0 || !this.isValidEmail(email)) return false;
    if (!this.isValidPassword(password)) return false;

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) throw new Error(error.message);
    return true;
  }

  /**
   * Log a user into the application with supabase.
   * 
   * @param email The email the user is logging in with.
   * @param password The password the user is logging in with in plain text format.
   * @returns True if the user was successfully logged in, false otherwise.
   * @throws Error if there was an issue with the database query (internal server error).
  */
  public static async LoginUserAsync(email: string, password: string): Promise<boolean> {
    if (email.length === 0 || password.length === 0 || !this.isValidEmail(email)) return false;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (!error)
      return true;
    
    if (error?.message === "Invalid login credentials")
      return false;
    else
      // All other errors are thrown as they are internal server errors
      throw new Error(error.message);
  }

  private static isValidEmail(email: string): boolean {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  }

  private static isValidPassword(password: string): boolean {
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasLetter && hasNumber;
  }
}