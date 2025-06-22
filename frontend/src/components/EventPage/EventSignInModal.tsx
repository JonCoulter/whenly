import React from "react";
import SignInModal from "../SignInModal";

const EventSignInModal: React.FC<any> = ({ open, onClose, title }) => (
  <SignInModal open={open} onClose={onClose} title={title} />
);

export default EventSignInModal;
