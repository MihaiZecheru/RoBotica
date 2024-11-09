import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";

interface Props extends AuthenticatedComponentDefaultProps {
 // TODO: Add props here
}

const SavedConversationsPage = ({ user }: Props) => {
  return (
    <div>
      <h1>Saved Conversations</h1>
    </div>
  );
}

export default SavedConversationsPage;