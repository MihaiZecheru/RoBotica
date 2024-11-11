import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";

const AccountPage = ({ user }: AuthenticatedComponentDefaultProps) => {
  return (
    <div>
      <h1>Account Page</h1>
    </div>
  );
}
 
export default AccountPage;