export function getErrorMessage(error: string | null) {
  switch (error) {
    case "CredentialsSignin":
      return "Invalid email or password.";
    case "OAuthAccountNotLinked":
      return "Email already registered with another provider.";
    default:
      return null;
  }
}
