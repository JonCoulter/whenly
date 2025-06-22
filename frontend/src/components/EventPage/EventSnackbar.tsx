import React from "react";
import { Snackbar, Alert } from "@mui/material";

const EventSnackbar: React.FC<any> = ({ snackbar, setSnackbar }) => (
  <Snackbar
    open={snackbar.open}
    autoHideDuration={6000}
    onClose={() => setSnackbar((prev: any) => ({ ...prev, open: false }))}
    anchorOrigin={{ vertical: "top", horizontal: "center" }}
  >
    <Alert
      onClose={() => setSnackbar((prev: any) => ({ ...prev, open: false }))}
      severity={snackbar.severity}
      sx={{ width: "100%" }}
    >
      {snackbar.message}
    </Alert>
  </Snackbar>
);

export default EventSnackbar;
