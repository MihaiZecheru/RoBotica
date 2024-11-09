import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";

interface Props extends AuthenticatedComponentDefaultProps {

}

const AccountPage = ({ user }: Props) => {
  return (
    <div>
      <h1>Account Page</h1>
    </div>
  );
}
 
export default AccountPage;