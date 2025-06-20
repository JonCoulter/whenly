import React from 'react';
import { Container, Typography, Box, List, ListItem } from '@mui/material';

const PrivacyPolicy: React.FC = () => (
  <Container maxWidth="md" sx={{ py: 4 }}>
    <Box>
      <Typography variant="h4" gutterBottom>
        Whenly Privacy Policy
      </Typography>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Effective Date: June 20, 2025
      </Typography>

      <Typography variant="body1" paragraph>
        Whenly ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our calendar management platform.
      </Typography>

      <Typography variant="h5" gutterBottom>1. Information We Collect</Typography>
      <Typography variant="body1" paragraph>
        We collect the following types of personal information:
      </Typography>
      <List>
        <ListItem>Google account information (name, email address, profile picture) via Google OAuth</ListItem>
        <ListItem>Google Calendar data (events, availability, free/busy slots) when you connect your calendar</ListItem>
        <ListItem>Event participation data (your name and, if logged in, your email) when you create or respond to events</ListItem>
        <ListItem>Session data (essential cookies for authentication)</ListItem>
        <ListItem>Guest participation data (name and availability) stored only in your browser's local/session storage</ListItem>
      </List>

      <Typography variant="h5" gutterBottom>2. How We Collect Information</Typography>
      <Typography variant="body1" paragraph>
        We collect information through:
      </Typography>
      <List>
        <ListItem>Google OAuth authentication and Google Calendar API integration (with your consent)</ListItem>
        <ListItem>User interactions with our service (creating or responding to events)</ListItem>
        <ListItem>Essential cookies for session management</ListItem>
      </List>

      <Typography variant="h5" gutterBottom>3. How We Use Your Information</Typography>
      <Typography variant="body1" paragraph>
        We use your information to:
      </Typography>
      <List>
        <ListItem>Provide and maintain our service</ListItem>
        <ListItem>Process and display your calendar data</ListItem>
        <ListItem>Share your availability with others (only when you choose to do so)</ListItem>
        <ListItem>Improve our service and communicate important updates</ListItem>
      </List>

      <Typography variant="h5" gutterBottom>4. Data Storage and Security</Typography>
      <Typography variant="body1" paragraph>
        Your data is stored securely in our database and protected by industry-standard security measures. We:
      </Typography>
      <List>
        <ListItem>Use encryption for data transmission</ListItem>
        <ListItem>Implement access controls and secure session cookies</ListItem>
        <ListItem>Limit access to personal information to authorized personnel only</ListItem>
        <ListItem>Regularly review our security practices</ListItem>
      </List>

      <Typography variant="h5" gutterBottom>5. Data Sharing and Disclosure</Typography>
      <Typography variant="body1" paragraph>
        We do not sell your personal information. We may share your information with:
      </Typography>
      <List>
        <ListItem>Google (as required for service functionality)</ListItem>
        <ListItem>Other users (only when you explicitly share your availability)</ListItem>
        <ListItem>Service providers who assist in operating our service (never for marketing or analytics)</ListItem>
      </List>
      <Typography variant="body1" paragraph>
        We may also disclose your information if required by law or to protect our rights.
      </Typography>

      <Typography variant="h5" gutterBottom>6. Cookies and Tracking</Typography>
      <Typography variant="body1" paragraph>
        We use only essential cookies for authentication and session management. We do not use tracking or analytics cookies. You can control cookies through your browser settings, but disabling them may affect your ability to use the service.
      </Typography>

      <Typography variant="h5" gutterBottom>7. Your Rights and Choices</Typography>
      <Typography variant="body1" paragraph>
        Depending on your location, you may have the right to:
      </Typography>
      <List>
        <ListItem>Access the personal information we hold about you</ListItem>
        <ListItem>Request correction or deletion of your data</ListItem>
        <ListItem>Export your data</ListItem>
        <ListItem>Opt out of certain data collection (by not using Google login or by deleting your account/event responses)</ListItem>
      </List>
      <Typography variant="body1" paragraph>
        To exercise these rights, please contact us at jonacoulter@gmail.com.
      </Typography>

      <Typography variant="h5" gutterBottom>8. International Data Transfers</Typography>
      <Typography variant="body1" paragraph>
        Your information may be processed and stored in the United States or other countries where our service providers operate. We take steps to ensure your data is protected in accordance with applicable laws (GDPR, CPRA/CCPA).
      </Typography>

      <Typography variant="h5" gutterBottom>9. Children's Privacy</Typography>
      <Typography variant="body1" paragraph>
        Whenly is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will promptly delete such data.
      </Typography>

      <Typography variant="h5" gutterBottom>10. Changes to This Policy</Typography>
      <Typography variant="body1" paragraph>
        We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of Whenly after changes are posted constitutes your acceptance of those changes.
      </Typography>

      <Typography variant="h5" gutterBottom>11. Contact Us</Typography>
      <Typography variant="body1" paragraph>
        If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at jonacoulter@gmail.com.
      </Typography>
    </Box>
  </Container>
);

export default PrivacyPolicy; 